'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSupabaseClient } from '@/lib/supabase-client';
import { Database, Play, AlertCircle, CheckCircle2, Download, Copy, Trash2 } from 'lucide-react';

interface QueryResult {
  data: any[] | null;
  error: string | null;
  rowCount: number;
  executionTime: number;
}

export function SqlEditor() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const predefinedQueries = [
    {
      name: 'View Balance History',
      query: `SELECT
  bh.*,
  u.email,
  u.full_name
FROM balance_history bh
LEFT JOIN auth.users u ON u.id = bh.user_id
ORDER BY bh.created_at DESC
LIMIT 50;`
    },
    {
      name: 'Get User Current Balances',
      query: `SELECT
  id,
  email,
  full_name,
  created_at
FROM auth.users
LIMIT 10;`
    },
    {
      name: 'Balance History for Specific User',
      query: `SELECT
  created_at,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  total_value
FROM balance_history
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;`
    },
    {
      name: 'Insert Sample Balance History',
      query: `INSERT INTO balance_history (
  user_id,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  total_value,
  recorded_at
) VALUES (
  auth.uid(),
  100000.00,
  50000.00,
  30000.00,
  2000000.00,
  40000.00,
  35000.00,
  255000.00,
  NOW()
);`
    },
    {
      name: 'Balance Trends (Last 30 Days)',
      query: `SELECT
  DATE(created_at) as date,
  AVG(total_value) as avg_total_value,
  COUNT(*) as snapshot_count
FROM balance_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;`
    },
    {
      name: 'Delete All Balance History',
      query: `DELETE FROM balance_history;`
    },
    {
      name: 'Create Manual Snapshot',
      query: `INSERT INTO balance_history (
  user_id,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  total_value,
  snapshot_type
)
SELECT
  a.user_id,
  COALESCE(a.usd_balance, 0),
  COALESCE(a.eur_balance, 0),
  COALESCE(a.gbp_balance, 0),
  COALESCE(a.jpy_balance, 0),
  COALESCE(a.cad_balance, 0),
  COALESCE(a.aud_balance, 0),
  COALESCE(a.usd_balance, 0) + COALESCE(a.eur_balance, 0) +
  COALESCE(a.gbp_balance, 0) + COALESCE(a.jpy_balance, 0) +
  COALESCE(a.cad_balance, 0) + COALESCE(a.aud_balance, 0),
  'manual'
FROM accounts a;`
    }
  ];

  const executeQuery = async () => {
    if (!query.trim()) {
      setResult({
        data: null,
        error: 'Please enter a query',
        rowCount: 0,
        executionTime: 0
      });
      return;
    }

    setIsExecuting(true);
    const startTime = performance.now();

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('execute_sql', {
        query: query.trim()
      });

      const endTime = performance.now();
      const executionTime = Math.round(endTime - startTime);

      if (error) {
        setResult({
          data: null,
          error: error.message,
          rowCount: 0,
          executionTime
        });
      } else {
        setResult({
          data: Array.isArray(data) ? data : data ? [data] : [],
          error: null,
          rowCount: Array.isArray(data) ? data.length : data ? 1 : 0,
          executionTime
        });

        if (!queryHistory.includes(query)) {
          setQueryHistory([query, ...queryHistory].slice(0, 10));
        }
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResult({
        data: null,
        error: err.message || 'Unknown error occurred',
        rowCount: 0,
        executionTime: Math.round(endTime - startTime)
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadPredefinedQuery = (queryText: string) => {
    setQuery(queryText);
    setResult(null);
  };

  const exportToJSON = () => {
    if (!result?.data) return;

    const dataStr = JSON.stringify(result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-result-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!result?.data || result.data.length === 0) return;

    const headers = Object.keys(result.data[0]);
    const csvContent = [
      headers.join(','),
      ...result.data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-result-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL Query Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SQL Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={executeQuery}
              disabled={isExecuting}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isExecuting ? 'Executing...' : 'Execute Query'}
            </Button>
            <Button
              onClick={() => {
                setQuery('');
                setResult(null);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Predefined Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {predefinedQueries.map((pq, index) => (
              <Button
                key={index}
                onClick={() => loadPredefinedQuery(pq.query)}
                variant="outline"
                className="justify-start text-left h-auto py-3"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{pq.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {pq.query.substring(0, 40)}...
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Query Result</CardTitle>
              {result.data && result.data.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={exportToJSON}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    JSON
                  </Button>
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    CSV
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Rows: {result.rowCount}</span>
              <span>Execution time: {result.executionTime}ms</span>
            </div>

            {result.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {result.data && result.data.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(result.data[0]).map((key) => (
                              <th key={key} className="px-4 py-2 text-left font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.data.map((row, index) => (
                            <tr key={index} className="border-t hover:bg-muted/50">
                              {Object.values(row).map((value: any, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2">
                                  {value === null ? (
                                    <span className="text-muted-foreground italic">null</span>
                                  ) : typeof value === 'object' ? (
                                    <div className="flex items-center gap-2">
                                      <pre className="text-xs max-w-xs overflow-hidden">
                                        {JSON.stringify(value, null, 2)}
                                      </pre>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(JSON.stringify(value, null, 2))}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Query executed successfully. No rows returned.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Query History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queryHistory.map((historyQuery, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => loadPredefinedQuery(historyQuery)}
                >
                  <pre className="text-xs flex-1 overflow-x-auto">
                    {historyQuery}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(historyQuery);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
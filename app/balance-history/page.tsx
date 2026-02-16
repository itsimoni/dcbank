'use client';

import { useState } from 'react';
import BalanceGraphHistory from '@/components/dashboard/balance-graph-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Database, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BalanceHistoryPage() {
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const { toast } = useToast();

  const createManualSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a snapshot',
          variant: 'destructive',
        });
        return;
      }

      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (accountError) {
        throw accountError;
      }

      const { error: insertError } = await supabase
        .from('balance_history')
        .insert({
          user_id: user.id,
          usd_balance: accountData.usd_balance || 0,
          eur_balance: accountData.eur_balance || 0,
          gbp_balance: accountData.gbp_balance || 0,
          jpy_balance: accountData.jpy_balance || 0,
          chf_balance: accountData.chf_balance || 0,
          cad_balance: accountData.cad_balance || 0,
          aud_balance: accountData.aud_balance || 0,
          total_value:
            (accountData.usd_balance || 0) +
            (accountData.eur_balance || 0) +
            (accountData.gbp_balance || 0) +
            (accountData.jpy_balance || 0) +
            (accountData.chf_balance || 0) +
            (accountData.cad_balance || 0) +
            (accountData.aud_balance || 0)
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Balance snapshot created successfully',
      });

      window.location.reload();
    } catch (error: any) {
      console.error('Error creating snapshot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create snapshot',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balance History</h1>
          <p className="text-muted-foreground mt-2">
            View and track your balance changes over time
          </p>
        </div>
        <Button
          onClick={createManualSnapshot}
          disabled={isCreatingSnapshot}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          {isCreatingSnapshot ? 'Creating...' : 'Create Snapshot'}
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Balance snapshots are automatically created whenever your account balance changes.
          You can also create manual snapshots using the button above.
        </AlertDescription>
      </Alert>

      <BalanceGraphHistory />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            About Balance History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Snapshots are automatically created when your balance changes</li>
              <li>Each snapshot records all currency balances at that moment</li>
              <li>Historical data is preserved even if balances change</li>
              <li>View trends and track your portfolio growth over time</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Select different time ranges (7 days to 1 year)</li>
              <li>See detailed currency breakdown in the chart</li>
              <li>Track changes and percentage growth</li>
              <li>Create manual snapshots at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
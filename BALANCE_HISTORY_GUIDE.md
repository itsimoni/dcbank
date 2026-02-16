# Balance History System Guide

## Overview

The balance history system automatically tracks and stores snapshots of user balances over time. This allows for historical analysis, trend visualization, and portfolio tracking.

## Database Table: `balance_history`

### Schema

```sql
balance_history (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  usd_balance numeric(20, 2),
  eur_balance numeric(20, 2),
  gbp_balance numeric(20, 2),
  jpy_balance numeric(20, 2),
  cad_balance numeric(20, 2),
  aud_balance numeric(20, 2),
  total_value numeric(20, 2),
  created_at timestamptz,
  recorded_at timestamptz
)
```

## Features

### 1. Automatic Snapshots

Balance snapshots are automatically created whenever a user's balance changes in the `accounts` table. This is handled by a database trigger.

### 2. Manual Snapshots

Users can create manual snapshots at any time:

**Via UI:**
- Navigate to `/balance-history`
- Click "Create Snapshot" button

**Via SQL:**
```sql
INSERT INTO balance_history (
  user_id,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  total_value
)
SELECT
  user_id,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  (usd_balance + eur_balance + gbp_balance + jpy_balance + cad_balance + aud_balance)
FROM accounts
WHERE user_id = auth.uid();
```

## Using the SQL Editor

### Access

Navigate to `/sql-editor` to access the SQL query editor.

### Features

1. **Execute Custom Queries**: Write and execute any SQL query
2. **Predefined Queries**: Quick access to common queries
3. **Export Results**: Download results as JSON or CSV
4. **Query History**: Automatically saves your last 10 queries

### Security

- SQL editor is only accessible to admin users
- All queries are executed with proper authentication checks
- Row Level Security (RLS) policies are enforced

## Common Queries

### View Recent Balance History

```sql
SELECT
  bh.*,
  u.email
FROM balance_history bh
LEFT JOIN auth.users u ON u.id = bh.user_id
ORDER BY bh.created_at DESC
LIMIT 50;
```

### Get Balance History for Specific User

```sql
SELECT
  created_at,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  total_value
FROM balance_history
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;
```

### Balance Trends (Last 30 Days)

```sql
SELECT
  DATE(created_at) as date,
  AVG(total_value) as avg_total_value,
  COUNT(*) as snapshot_count
FROM balance_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Create Bulk Snapshots for All Users

```sql
INSERT INTO balance_history (
  user_id,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  total_value
)
SELECT
  user_id,
  usd_balance,
  eur_balance,
  gbp_balance,
  jpy_balance,
  cad_balance,
  aud_balance,
  (usd_balance + eur_balance + gbp_balance + jpy_balance + cad_balance + aud_balance)
FROM accounts;
```

### Delete Old Snapshots (Older than 1 year)

```sql
DELETE FROM balance_history
WHERE created_at < NOW() - INTERVAL '1 year';
```

## Visualization

### Balance History Page

Navigate to `/balance-history` to view:

- Interactive balance trend chart
- Time range selector (7 days to 1 year)
- Current balance and change statistics
- Currency breakdown over time

### Features

- **Time Range Selection**: View data for different time periods
- **Interactive Chart**: Hover to see detailed values
- **Statistics**: See current balance, change, and percentage growth
- **Refresh**: Manually refresh data

## API Usage

### Fetch Balance History

```typescript
const { data, error } = await supabase
  .from('balance_history')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .order('created_at', { ascending: true });
```

### Create Manual Snapshot

```typescript
const { error } = await supabase
  .from('balance_history')
  .insert({
    user_id: userId,
    usd_balance: 1000,
    eur_balance: 500,
    gbp_balance: 300,
    jpy_balance: 50000,
    cad_balance: 400,
    aud_balance: 350,
    total_value: 2550
  });
```

## Best Practices

1. **Regular Snapshots**: Ensure snapshots are created regularly for accurate trends
2. **Data Retention**: Consider archiving old snapshots after a certain period
3. **Performance**: Use indexes on `user_id` and `created_at` for faster queries
4. **Monitoring**: Track the growth of the table and plan for scaling

## Troubleshooting

### No Data Showing

1. Check if balance_history table has data:
```sql
SELECT COUNT(*) FROM balance_history;
```

2. Verify user has snapshots:
```sql
SELECT COUNT(*) FROM balance_history WHERE user_id = auth.uid();
```

3. Create a manual snapshot if needed

### Chart Not Loading

1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies are correctly configured
4. Ensure user is authenticated

## Pages

- `/balance-history` - View balance history and trends
- `/sql-editor` - Execute SQL queries (admin only)

## Components

- `BalanceGraphHistory` - Display historical balance trends
- `SqlEditor` - Execute and manage SQL queries
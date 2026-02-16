import { SqlEditor } from '@/components/admin/sql-editor';

export default function SqlEditorPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Database SQL Editor</h1>
        <p className="text-muted-foreground mt-2">
          Execute SQL queries directly on your Supabase database. The balance_history table stores historical balance snapshots for all users.
        </p>
      </div>
      <SqlEditor />
    </div>
  );
}
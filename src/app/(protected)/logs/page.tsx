/**
 * Activity Logs Page — server rendered, shows all tracked actions
 */
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function LogsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Fetch all logs, newest first
  const { data: logs } = await supabaseAdmin
    .from('activity_logs')
    .select('*')
    .eq('store_id', session.userId)
    .order('created_at', { ascending: false })
    .limit(500)

  // Pill class for each action type
  const actionPills: Record<string, string> = {
    Login: 'pill pill-accent',
    Logout: 'pill',
    'Product Added': 'pill pill-success',
    'Product Updated': 'pill pill-warn',
    'Product Deleted': 'pill pill-danger',
    'Sale Completed': 'pill pill-success',
  }

  function getActionPill(action: string): string {
    return actionPills[action] || 'pill'
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[1280px] mx-auto">
      <div className="page-header">
        <h1 className="page-title text-[22px]">Activity logs</h1>
        <p className="page-subtitle">{logs?.length ?? 0} {logs && logs.length === 1 ? 'action' : 'actions'} recorded</p>
      </div>

      <div className="surface overflow-hidden">
        {!logs || logs.length === 0 ? (
          <p className="p-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No activity recorded yet.
          </p>
        ) : (
          <div className="table-container">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap">
                      <p style={{ color: 'var(--text)' }}>
                        {new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-[12px] mt-0.5 tabular" style={{ color: 'var(--text-subtle)' }}>
                        {new Date(log.created_at).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </td>
                    <td>
                      <span className={getActionPill(log.action)}>{log.action}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

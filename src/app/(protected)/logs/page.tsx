/**
 * Activity Logs Page — server rendered, shows all tracked actions
 */
import { supabaseAdmin } from '@/lib/supabase'

export default async function LogsPage() {
  // Fetch all logs, newest first
  const { data: logs } = await supabaseAdmin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  // Color coding for different action types
  const actionColors: Record<string, string> = {
    Login: 'bg-blue-100 text-blue-700',
    Logout: 'bg-gray-100 text-gray-600',
    'Product Added': 'bg-green-100 text-green-700',
    'Product Updated': 'bg-yellow-100 text-yellow-700',
    'Product Deleted': 'bg-red-100 text-red-700',
    'Sale Completed': 'bg-purple-100 text-purple-700',
  }

  function getActionColor(action: string): string {
    return actionColors[action] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-xs text-gray-500">{logs?.length ?? 0} actions recorded</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm table-container">
        {!logs || logs.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No activity recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 text-xs">Timestamp</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 text-xs">Action</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-600 text-xs">Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                    <p>{new Date(log.created_at).toLocaleDateString('en-PH')}</p>
                    <p className="text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString('en-PH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

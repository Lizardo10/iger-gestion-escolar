import { useState } from 'react';

const MOCK_INVOICES = [
  {
    id: '1',
    studentId: 'student-1',
    amount: 50000,
    status: 'pending' as const,
    dueDate: '2024-01-31',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    studentId: 'student-2',
    amount: 50000,
    status: 'paid' as const,
    dueDate: '2024-01-31',
    createdAt: '2024-01-01T00:00:00Z',
    paidAt: '2024-01-15T14:30:00Z',
  },
];

export function Payments() {
  const [invoices] = useState(MOCK_INVOICES);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pagos</h1>
        <button className="btn btn-primary">+ Nueva Factura</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Total Pendiente</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(invoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0))}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Total Pagado</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0))}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-2">Total Facturas</h3>
          <p className="text-2xl font-bold text-primary-600">{invoices.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Monto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha Límite</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">#{invoice.id}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{invoice.dueDate}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="text-primary-600 hover:text-primary-800 text-sm">Ver</button>
                    {invoice.status === 'pending' && (
                      <button className="text-green-600 hover:text-green-800 text-sm">Pagar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoices.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hay facturas</p>
        </div>
      )}
    </div>
  );
}

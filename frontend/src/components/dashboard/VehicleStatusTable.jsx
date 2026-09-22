import { Link } from 'react-router-dom';
import { Star, Car } from 'lucide-react';
import Badge from '../ui/Badge';

const getStatusVariant = (status) => {
  const variants = {
    'available': 'success',
    'approved': 'success',
    'pending': 'warning',
    'booked': 'primary',
    'unavailable': 'danger',
    'rejected': 'danger',
    'suspended': 'danger',
  };
  return variants[status] || 'default';
};

const VehicleStatusTable = ({ vehicles }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Daily Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bookings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {vehicle.primary_image ? (
                      <img
                        src={vehicle.primary_image}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-16 h-12 object-cover rounded-lg"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Car className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">
                        {vehicle.brand === vehicle.model
                          ? `${vehicle.brand} ${vehicle.year}`
                          : `${vehicle.brand} ${vehicle.model}`}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {vehicle.year} • {vehicle.vehicle_type}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  ৳{Number(vehicle.daily_rate).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {vehicle.total_bookings || 0}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={getStatusVariant(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      to={`/owner/vehicles/${vehicle.id}/edit`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/vehicles/${vehicle.id}`}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleStatusTable;
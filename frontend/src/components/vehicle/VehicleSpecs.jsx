import { 
  Users, 
  Settings, 
  Fuel, 
  Calendar, 
  Palette,
  FileText,
} from 'lucide-react';

const VehicleSpecs = ({ vehicle }) => {
  const specs = [
    { icon: Users, label: 'Seats', value: `${vehicle.seats} Seats` },
    { icon: Settings, label: 'Transmission', value: vehicle.transmission },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuel_type },
    { icon: Calendar, label: 'Year', value: vehicle.year },
    { icon: Palette, label: 'Color', value: vehicle.color },
    { icon: FileText, label: 'Registration', value: vehicle.registration_number },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <div key={spec.label} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{spec.label}</p>
              <p className="text-sm font-medium text-slate-900 capitalize">{spec.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VehicleSpecs;
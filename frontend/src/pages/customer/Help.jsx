import { HelpCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/admin/PageHeader';

const CustomerHelp = () => {
  return (
    <div>
      <PageHeader title="Help & Support" description="Get assistance with your bookings" />
      <Card className="py-8 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Contact: support@udrivebd.com</p>
      </Card>
    </div>
  );
};

export default CustomerHelp;
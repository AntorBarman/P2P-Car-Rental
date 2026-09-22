import { Car, Shield, Users, MapPin } from 'lucide-react';
import Card from '../../components/ui/Card';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        About UDrive Bangladesh
      </h1>
      
      <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
        UDrive Bangladesh is a peer-to-peer self-drive car rental platform
        connecting verified car owners with trusted renters.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-hover p-5 text-center">
          <Car className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Our Mission</h3>
          <p className="text-sm text-slate-500">Making car rental accessible, affordable, and safe for everyone.</p>
        </Card>
        <Card className="card-hover p-5 text-center">
          <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Our Promise</h3>
          <p className="text-sm text-slate-500">Every vehicle and user goes through strict verification.</p>
        </Card>
      </div>
    </div>
  );
};

export default About;
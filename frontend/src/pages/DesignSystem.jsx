import { useState } from 'react';
import { Search, Car, User, AlertCircle, Inbox } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

const DesignSystem = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">UDrive Design System</h1>
      
      {/* Colors */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-primary h-24 rounded-lg flex items-end p-3">
            <span className="text-white text-sm">Primary</span>
          </div>
          <div className="bg-primary-hover h-24 rounded-lg flex items-end p-3">
            <span className="text-white text-sm">Primary Dark</span>
          </div>
          <div className="bg-success h-24 rounded-lg flex items-end p-3">
            <span className="text-white text-sm">Success</span>
          </div>
          <div className="bg-warning h-24 rounded-lg flex items-end p-3">
            <span className="text-white text-sm">Warning</span>
          </div>
          <div className="bg-danger h-24 rounded-lg flex items-end p-3">
            <span className="text-white text-sm">Danger</span>
          </div>
        </div>
      </section>
      
      {/* Buttons */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button icon={Search}>With Icon</Button>
          <Button fullWidth>Full Width</Button>
        </div>
      </section>
      
      {/* Badges */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
      
      {/* Inputs */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Inputs</h2>
        <div className="max-w-md space-y-4">
          <Input
            label="Email Address"
            placeholder="Enter your email"
            icon={User}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            error={inputError}
          />
          <Input
            label="Search"
            placeholder="Search vehicles..."
            icon={Search}
            hint="Search by brand, model, or location"
          />
        </div>
      </section>
      
      {/* Loading States */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Loading States</h2>
        <div className="flex gap-8">
          <div className="text-center">
            <Spinner size="sm" />
            <p className="text-xs text-text-muted mt-2">Small</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="text-xs text-text-muted mt-2">Medium</p>
          </div>
          <div className="text-center">
            <Spinner size="lg" />
            <p className="text-xs text-text-muted mt-2">Large</p>
          </div>
        </div>
        
        <div className="mt-8 max-w-md space-y-4">
          <Skeleton variant="title" />
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="image" />
          <Skeleton variant="button" />
        </div>
      </section>
      
      {/* Cards */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="font-semibold mb-2">Basic Card</h3>
            <p className="text-sm text-text-muted">Simple card with default padding.</p>
          </Card>
          <Card hoverable>
            <h3 className="font-semibold mb-2">Hoverable Card</h3>
            <p className="text-sm text-text-muted">Hover to see the effect.</p>
          </Card>
          <Card className="bg-primary text-white border-primary">
            <h3 className="font-semibold mb-2">Custom Card</h3>
            <p className="text-sm opacity-80">Custom styling with className.</p>
          </Card>
        </div>
      </section>
      
      {/* Empty & Error States */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Empty & Error States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <EmptyState
              title="No vehicles found"
              description="Try adjusting your filters to find available vehicles."
              icon={Car}
              action={<Button size="sm">Clear Filters</Button>}
            />
          </Card>
          <Card>
            <ErrorState
              title="Failed to load vehicles"
              message="There was a problem connecting to the server."
              onRetry={() => alert('Retrying...')}
            />
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DesignSystem;
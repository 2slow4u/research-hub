import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search & Monitor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your research sources and monitoring setup
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Search & Monitor Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            This feature will allow you to monitor RSS feeds, websites, and other sources for new research content.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
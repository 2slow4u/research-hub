import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { FileText, Plus } from 'lucide-react';

export default function SummariesPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Summaries</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage all your research summaries
          </p>
        </div>
        <Link href="/">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Summary
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Summary Management Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            This page will show all your research summaries with search, filtering, and export capabilities.
          </p>
          <Link href="/">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Summary from Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
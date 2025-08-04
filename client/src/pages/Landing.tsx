import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Search, FileText, Shield, Users, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">ResearchHub</h1>
          </div>
          <Button onClick={handleLogin} size="lg">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
          AI-Powered Research
          <span className="block text-primary">Made Simple</span>
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-8">
          Automatically collect, monitor, and summarize the latest research content from trusted sources. 
          Create comprehensive summaries with AI assistance and manage your research workflow efficiently.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3">
            Get Started Free
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-3">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-12">
          Powerful Research Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Smart Content Monitoring</CardTitle>
              <CardDescription>
                Automatically collect and monitor the latest research content based on your keywords from trusted sources.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>AI-Powered Summaries</CardTitle>
              <CardDescription>
                Generate comprehensive or differential summaries using advanced AI to prepare content for blog posts and reports.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle>Canvas Editing</CardTitle>
              <CardDescription>
                Edit and customize your summaries with a canvas-like interface, add annotations, and organize content visually.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Source Management</CardTitle>
              <CardDescription>
                Whitelist trusted sources, manage reputation scoring, and ensure content quality with advanced filtering.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Multi-User Support</CardTitle>
              <CardDescription>
                Secure authentication, user management, and role-based access control with comprehensive admin tools.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Export & Share</CardTitle>
              <CardDescription>
                Export summaries in multiple formats (Word, Markdown, PDF) and share your research findings easily.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Ready to Transform Your Research?
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
            Join researchers worldwide who are using ResearchHub to streamline their content monitoring and summary generation.
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3">
            Start Your Research Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          <p>&copy; 2024 ResearchHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

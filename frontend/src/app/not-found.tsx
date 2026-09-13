import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-12 flex justify-center items-center">
      <EmptyState
        icon={<FileQuestion className="h-6 w-6 text-content-muted" aria-hidden="true" />}
        title="Page Not Found"
        description="The requested page does not exist or belongs to a later implementation stage."
        action={
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Return to Foundation Overview
            </Button>
          </Link>
        }
      />
    </div>
  );
}

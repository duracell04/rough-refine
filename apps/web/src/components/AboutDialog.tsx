import { conceptMarkup } from "@roughrefine/brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-sm font-medium">About</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>RoughRefine</DialogTitle>
          <DialogDescription>Sketch fast. Refine precisely. Export clean SVG.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <figure className="mx-auto max-w-xs">
            <div
              className="rounded-xl bg-slate-950/90 p-4 shadow-lg"
              dangerouslySetInnerHTML={{ __html: conceptMarkup }}
            />
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              Brand concept mark — dual-layer "R" representing rough-to-refined workflows.
            </figcaption>
          </figure>
          <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Prototype build</p>
            <p>Bi-directional SVG editing, Monaco diagnostics, and deterministic exports.</p>
            <p className="mt-2 font-mono text-xs text-foreground">Version {__APP_VERSION__}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

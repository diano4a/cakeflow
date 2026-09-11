import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">CakeFlow</h1>
      <p className="max-w-md text-muted-foreground">
        Order and production management for pastry chefs and small
        confectionery businesses.
      </p>
      <Button>Get started</Button>
    </main>
  );
}

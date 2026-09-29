"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || res.data || []);
    } catch (error) {
      console.error("[Location Express] Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setAdding(true);
    try {
      await api.post('/categories', { name, description });
      toast.success("Catégorie créée avec succès !");
      setName("");
      setDescription("");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la création de la catégorie.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gestion des Catégories</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Creation Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Ajouter une catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom de la catégorie</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1.5 p-2 border rounded-md bg-background text-sm"
                  placeholder="Ex: Utilitaire, Berline"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1.5 p-2 border rounded-md bg-background text-sm h-24 resize-none"
                  placeholder="Description de la catégorie..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={adding}>
                {adding ? "Création..." : "Ajouter"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Liste des catégories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Chargement des catégories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Aucune catégorie trouvée.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Nombre Véhicules</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>{cat.id}</TableCell>
                      <TableCell className="font-semibold">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{cat.description || "-"}</TableCell>
                      <TableCell className="text-right font-bold">{cat.vehicles_count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

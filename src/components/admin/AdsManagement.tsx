
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { LayoutDashboard, PenSquare, Save, Trash2 } from "lucide-react";

interface AdUnit {
  id: string;
  name: string;
  code: string;
  placement: string;
  active: boolean;
}

const AdsManagement = () => {
  const [newAdUnit, setNewAdUnit] = useState({
    name: "",
    code: "",
    placement: "header", // Default placement
    active: true
  });
  
  const [adUnits, setAdUnits] = useState<AdUnit[]>([
    {
      id: "1",
      name: "Header Banner",
      code: "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n<!-- Header -->\n<ins class=\"adsbygoogle\"\n     style=\"display:block\"\n     data-ad-client=\"ca-pub-XXXXXXXXXXXXXXXX\"\n     data-ad-slot=\"XXXXXXXXXX\"\n     data-ad-format=\"auto\"\n     data-full-width-responsive=\"true\"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>",
      placement: "header",
      active: true
    },
    {
      id: "2",
      name: "Footer Banner",
      code: "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n<!-- Footer -->\n<ins class=\"adsbygoogle\"\n     style=\"display:block\"\n     data-ad-client=\"ca-pub-XXXXXXXXXXXXXXXX\"\n     data-ad-slot=\"XXXXXXXXXX\"\n     data-ad-format=\"auto\"\n     data-full-width-responsive=\"true\"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>",
      placement: "footer",
      active: false
    },
    {
      id: "3",
      name: "Sidebar Banner",
      code: "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n<!-- Sidebar -->\n<ins class=\"adsbygoogle\"\n     style=\"display:block\"\n     data-ad-client=\"ca-pub-XXXXXXXXXXXXXXXX\"\n     data-ad-slot=\"XXXXXXXXXX\"\n     data-ad-format=\"auto\"\n     data-full-width-responsive=\"true\"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>",
      placement: "sidebar",
      active: true
    }
  ]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    placement: "",
    active: true
  });
  
  const [adsenseId, setAdsenseId] = useState("ca-pub-XXXXXXXXXXXXXXXX");

  const handleAddAdUnit = async () => {
    if (!newAdUnit.name || !newAdUnit.code) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e código do anúncio são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real app, would save to supabase
      // const { data, error } = await supabase
      //   .from('ad_units')
      //   .insert([newAdUnit])
      //   .select();
      
      // if (error) throw error;
      
      // For demo, just update local state
      const newId = (Math.max(...adUnits.map(ad => parseInt(ad.id))) + 1).toString();
      setAdUnits([
        ...adUnits,
        {
          ...newAdUnit,
          id: newId
        }
      ]);
      
      // Reset form
      setNewAdUnit({
        name: "",
        code: "",
        placement: "header",
        active: true
      });
      
      toast({
        title: "Anúncio adicionado",
        description: "O bloco de anúncio foi salvo com sucesso.",
      });
    } catch (error) {
      console.error("Error adding ad unit:", error);
      toast({
        title: "Erro ao adicionar anúncio",
        description: "Não foi possível salvar o bloco de anúncio.",
        variant: "destructive",
      });
    }
  };

  const handleEditStart = (adUnit: AdUnit) => {
    setEditingId(adUnit.id);
    setEditForm({
      name: adUnit.name,
      code: adUnit.code,
      placement: adUnit.placement,
      active: adUnit.active
    });
  };

  const handleEditSave = async (id: string) => {
    try {
      // In a real app, would save to supabase
      // const { error } = await supabase
      //   .from('ad_units')
      //   .update(editForm)
      //   .eq('id', id);
      
      // if (error) throw error;
      
      // For demo, just update local state
      setAdUnits(adUnits.map(ad => 
        ad.id === id ? { ...ad, ...editForm } : ad
      ));
      
      setEditingId(null);
      
      toast({
        title: "Anúncio atualizado",
        description: "O bloco de anúncio foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error updating ad unit:", error);
      toast({
        title: "Erro ao atualizar anúncio",
        description: "Não foi possível atualizar o bloco de anúncio.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // In a real app, would delete from supabase
      // const { error } = await supabase
      //   .from('ad_units')
      //   .delete()
      //   .eq('id', id);
      
      // if (error) throw error;
      
      // For demo, just update local state
      setAdUnits(adUnits.filter(ad => ad.id !== id));
      
      toast({
        title: "Anúncio removido",
        description: "O bloco de anúncio foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting ad unit:", error);
      toast({
        title: "Erro ao remover anúncio",
        description: "Não foi possível remover o bloco de anúncio.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      // In a real app, would update in supabase
      // const { error } = await supabase
      //   .from('ad_units')
      //   .update({ active: !currentActive })
      //   .eq('id', id);
      
      // if (error) throw error;
      
      // For demo, just update local state
      setAdUnits(adUnits.map(ad => 
        ad.id === id ? { ...ad, active: !currentActive } : ad
      ));
      
      toast({
        title: currentActive ? "Anúncio desativado" : "Anúncio ativado",
        description: `O bloco de anúncio foi ${currentActive ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error) {
      console.error("Error toggling ad status:", error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do anúncio.",
        variant: "destructive",
      });
    }
  };

  const saveAdsenseId = () => {
    // In a real app, would save to supabase or config
    toast({
      title: "ID do AdSense salvo",
      description: "O ID do Google AdSense foi salvo com sucesso.",
    });
  };

  const placementOptions = [
    { value: 'header', label: 'Cabeçalho' },
    { value: 'footer', label: 'Rodapé' },
    { value: 'sidebar', label: 'Barra Lateral' },
    { value: 'content', label: 'Dentro do Conteúdo' },
    { value: 'popup', label: 'Pop-up' }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Gerenciar Anúncios
          </TabsTrigger>
          <TabsTrigger value="new">
            <PenSquare className="h-4 w-4 mr-2" />
            Novo Anúncio
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do AdSense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    ID do Google AdSense
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={adsenseId}
                      onChange={(e) => setAdsenseId(e.target.value)}
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    />
                    <Button onClick={saveAdsenseId}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Blocos de Anúncios</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Posicionamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adUnits.map((adUnit) => (
                    <TableRow key={adUnit.id}>
                      <TableCell>
                        {editingId === adUnit.id ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          />
                        ) : (
                          adUnit.name
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === adUnit.id ? (
                          <select
                            className="w-full p-2 border rounded"
                            value={editForm.placement}
                            onChange={(e) => setEditForm({...editForm, placement: e.target.value})}
                          >
                            {placementOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          placementOptions.find(opt => opt.value === adUnit.placement)?.label
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {editingId === adUnit.id ? (
                            <Switch 
                              checked={editForm.active}
                              onCheckedChange={(checked) => setEditForm({...editForm, active: checked})}
                            />
                          ) : (
                            <Switch 
                              checked={adUnit.active}
                              onCheckedChange={() => handleToggleActive(adUnit.id, adUnit.active)}
                            />
                          )}
                          <span className="ml-2">
                            {(editingId === adUnit.id ? editForm.active : adUnit.active) ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === adUnit.id ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleEditSave(adUnit.id)}>
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditStart(adUnit)}>
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDelete(adUnit.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {editingId && (
                <div className="mt-4 border p-4 rounded-md">
                  <label className="block text-sm font-medium mb-1">
                    Código do Anúncio
                  </label>
                  <Textarea 
                    value={editForm.code}
                    onChange={(e) => setEditForm({...editForm, code: e.target.value})}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Novo Bloco de Anúncio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Nome do Anúncio
                </label>
                <Input 
                  value={newAdUnit.name}
                  onChange={(e) => setNewAdUnit({...newAdUnit, name: e.target.value})}
                  placeholder="Ex: Banner Topo da Página"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  Posicionamento
                </label>
                <select
                  className="w-full p-2 border rounded mt-1"
                  value={newAdUnit.placement}
                  onChange={(e) => setNewAdUnit({...newAdUnit, placement: e.target.value})}
                >
                  {placementOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  Código do Anúncio
                </label>
                <Textarea 
                  value={newAdUnit.code}
                  onChange={(e) => setNewAdUnit({...newAdUnit, code: e.target.value})}
                  placeholder="Cole o código do AdSense aqui..."
                  rows={10}
                  className="font-mono text-sm mt-1"
                />
              </div>
              
              <div className="flex items-center">
                <Switch 
                  id="active-status"
                  checked={newAdUnit.active}
                  onCheckedChange={(checked) => setNewAdUnit({...newAdUnit, active: checked})}
                />
                <label htmlFor="active-status" className="ml-2">
                  Ativar anúncio imediatamente
                </label>
              </div>
              
              <Button onClick={handleAddAdUnit} className="w-full">
                Adicionar Bloco de Anúncio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdsManagement;

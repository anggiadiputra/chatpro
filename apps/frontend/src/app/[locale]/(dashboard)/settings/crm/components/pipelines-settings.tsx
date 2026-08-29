"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, Pencil, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Stage {
  id?: string
  name: string
  color: string
  order: number
}

interface Pipeline {
  id: string
  name: string
  description?: string
  isDefault: boolean
  stages: Stage[]
}

const DEFAULT_STAGES = [
  { name: "New", color: "#3b82f6", order: 0 },
  { name: "Contacted", color: "#eab308", order: 1 },
  { name: "Qualified", color: "#22c55e", order: 2 },
  { name: "Lost", color: "#ef4444", order: 3 }
]

export function PipelinesSettings() {
  const t = useTranslations('common')
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    stages: Stage[]
  }>({
    name: "",
    stages: []
  })

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
      const res = await fetch(`${apiUrl}/api/v1/crm/pipelines`, {
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setPipelines(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch pipelines", error)
      toast({ title: "Failed to fetch pipelines", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (pipeline?: Pipeline) => {
    if (pipeline) {
      setEditingPipeline(pipeline)
      setFormData({
        name: pipeline.name,
        stages: [...pipeline.stages].sort((a, b) => a.order - b.order)
      })
    } else {
      setEditingPipeline(null)
      setFormData({
        name: "New Pipeline",
        stages: [...DEFAULT_STAGES]
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
      const url = editingPipeline
        ? `${apiUrl}/api/v1/crm/pipelines/${editingPipeline.id}`
        : `${apiUrl}/api/v1/crm/pipelines`

      const method = editingPipeline ? 'PATCH' : 'POST'

      // Ensure stages have correct order
      const stagesWithOrder = formData.stages.map((stage, index) => ({
        ...stage,
        order: index
      }))

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          stages: stagesWithOrder
        })
      })

      const data = await res.json()
      if (data.success) {
        toast({ title: `Pipeline ${editingPipeline ? 'updated' : 'created'}` })
        setIsDialogOpen(false)
        fetchPipelines()
      } else {
        toast({ title: data.error || "Operation failed", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error saving pipeline", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the pipeline and all associated data.")) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
      const res = await fetch(`${apiUrl}/api/v1/crm/pipelines/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        toast({ title: "Pipeline deleted" })
        fetchPipelines()
      } else {
        toast({ title: "Failed to delete", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error deleting pipeline", variant: "destructive" })
    }
  }

  const handleStageChange = (index: number, field: keyof Stage, value: string) => {
    const newStages = [...formData.stages]
    newStages[index] = { ...newStages[index], [field]: value }
    setFormData({ ...formData, stages: newStages })
  }

  const handleAddStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        { name: "New Stage", color: "#94a3b8", order: formData.stages.length }
      ]
    })
  }

  const handleRemoveStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index)
    setFormData({ ...formData, stages: newStages })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Sales Pipelines</h4>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Pipeline
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {pipeline.name}
                      {pipeline.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                      )}
                    </CardTitle>
                    <CardDescription>{pipeline.stages.length} stages</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pipeline)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {!pipeline.isDefault && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pipeline.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {pipeline.stages.map((stage) => (
                    <div
                      key={stage.id || stage.name}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
                      style={{ borderColor: stage.color, color: stage.color }}
                    >
                      {stage.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPipeline ? 'Edit Pipeline' : 'New Pipeline'}</DialogTitle>
            <DialogDescription>
              Configure your sales pipeline stages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Pipeline Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sales Pipeline"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Stages</Label>
                <Button variant="outline" size="sm" onClick={handleAddStage}>
                  <Plus className="mr-2 h-3 w-3" /> Add Stage
                </Button>
              </div>

              <div className="space-y-3">
                {formData.stages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                    <div className="cursor-move text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={stage.name}
                        onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                        placeholder="Stage Name"
                        className="h-8"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={stage.color}
                          onChange={(e) => handleStageChange(index, 'color', e.target.value)}
                          className="h-8 w-12 p-1"
                        />
                        <Input
                          value={stage.color}
                          onChange={(e) => handleStageChange(index, 'color', e.target.value)}
                          placeholder="#000000"
                          className="h-8 flex-1"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveStage(index)}
                      disabled={formData.stages.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

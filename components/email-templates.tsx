"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2, Save, X, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Define email template type
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  senderName?: string // Tambahkan field senderName
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  // Load templates from localStorage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem("emailTemplates")
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates) as EmailTemplate[]
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setTemplates(parsedTemplates)
        } else {
          // Set default template if parsed data is invalid
          setDefaultTemplate()
        }
      } else {
        // Set default template if no templates exist
        setDefaultTemplate()
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      // Set default template on error
      setDefaultTemplate()
    }
  }, [])

  // Function to set default template
  const setDefaultTemplate = () => {
    const defaultTemplate: EmailTemplate = {
      id: "default",
      name: "Default Template",
      subject: "NBD CHARITY - Eid al-Adha 2025",
      senderName: "NBD CHARITY", // Default sender name
      body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NBD CHARITY - Eid al-Adha 2025</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>NBD CHARITY - Eid al-Adha 2025</h2>
        <p>Merci pour vote confiance, n'hésitez pas à me contacter si vous voulez parrainer les orphelins sur le long terme </p>

        <p>Rejoignez le groupe telegram en cliquant sur ce lien : </p>

        <p> https://t.me/nbdcharity </p>

        <p> Qu'Allah vous récompense </p>
        {{content}}
        <p style="margin-top: 30px; color: #666;">Envoyé via sender.juhndaa.my.id</p>
      </body>
      </html>
    `,
    }
    setTemplates([defaultTemplate])
    localStorage.setItem("emailTemplates", JSON.stringify([defaultTemplate]))
  }

  // Save templates to localStorage
  const saveTemplates = (updatedTemplates: EmailTemplate[]) => {
    localStorage.setItem("emailTemplates", JSON.stringify(updatedTemplates))
    setTemplates(updatedTemplates)
  }

  // Add new template
  const addTemplate = () => {
    setCurrentTemplate({
      id: Date.now().toString(),
      name: "",
      subject: "",
      senderName: "NBD CHARITY", // Default sender name
      body: "",
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  // Edit template
  const editTemplate = (template: EmailTemplate) => {
    setCurrentTemplate({ ...template })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  // Delete template
  const deleteTemplate = (templateId: string) => {
    if (templates.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one template",
        variant: "destructive",
      })
      return
    }

    if (confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter((t) => t.id !== templateId)
      saveTemplates(updatedTemplates)
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully",
      })
    }
  }

  // Save template
  const saveTemplate = () => {
    if (!currentTemplate) return

    if (!currentTemplate.name || !currentTemplate.subject || !currentTemplate.body) {
      toast({
        title: "Validation error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Make sure body contains {{content}} placeholder
    if (!currentTemplate.body.includes("{{content}}")) {
      toast({
        title: "Template error",
        description: "Template body must include {{content}} placeholder for images",
        variant: "destructive",
      })
      return
    }

    let updatedTemplates: EmailTemplate[]

    if (isEditing) {
      updatedTemplates = templates.map((t) => (t.id === currentTemplate.id ? currentTemplate : t))
    } else {
      updatedTemplates = [...templates, currentTemplate]
    }

    saveTemplates(updatedTemplates)
    setIsDialogOpen(false)
    toast({
      title: isEditing ? "Template updated" : "Template added",
      description: `Template "${currentTemplate.name}" has been ${isEditing ? "updated" : "added"} successfully`,
    })
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
              Email Templates
            </CardTitle>
            <CardDescription className="text-sm">Create and manage email templates for sending images</CardDescription>
          </div>
          <Button onClick={addTemplate} size="sm" className="text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Add Template
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        <ScrollArea className="h-[300px]">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No templates yet. Create your first template.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <div className="p-4 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{template.name}</h3>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editTemplate(template)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplate(template.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={templates.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Subject: {template.subject}</p>
                    <p className="text-sm text-muted-foreground">From: {template.senderName || "NBD CHARITY"}</p>
                  </div>
                  <div className="p-4 border-t max-h-32 overflow-hidden text-ellipsis">
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                      {template.body.replace(/(<([^>]+)>)/gi, "")}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Template Edit Dialog - Using a simple modal instead of Dialog component */}
        {isDialogOpen && currentTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{isEditing ? "Edit Template" : "Add New Template"}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={currentTemplate.name}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                      placeholder="e.g., Default Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-subject">Email Subject</Label>
                    <Input
                      id="template-subject"
                      value={currentTemplate.subject}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                      placeholder="e.g., NBD CHARITY - Zakat Al fitri 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-sender">Sender Name</Label>
                    <Input
                      id="template-sender"
                      value={currentTemplate.senderName || ""}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, senderName: e.target.value })}
                      placeholder="e.g., NBD CHARITY"
                    />
                    <p className="text-xs text-muted-foreground">This name will appear as the sender of the email</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-body">
                      Email Body (HTML) - Include <code className="bg-muted p-1 rounded">{"{{content}}"}</code> where
                      images should appear
                    </Label>
                    <Textarea
                      id="template-body"
                      value={currentTemplate.body}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
                      placeholder="<div>Your email content here... {{content}}</div>"
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

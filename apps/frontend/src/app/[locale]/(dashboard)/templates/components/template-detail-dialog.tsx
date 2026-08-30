"use client"

import {
  Image,
  Video,
  File,
  CaseSensitive,
  Link,
  Phone,
  MessageSquare,
  Variable,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Template, countTemplateVariables, hasDynamicUrl } from "../data/schema"

interface TemplateDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
}

const headerTypeIcons: Record<string, React.ElementType> = {
  TEXT: CaseSensitive,
  IMAGE: Image,
  VIDEO: Video,
  DOCUMENT: File,
}

/**
 * Highlight variables in text by wrapping them in styled spans
 */
function highlightVariables(text: string): React.ReactNode {
  const parts = text.split(/(\{\{\d+\}\})/g)
  return parts.map((part, index) => {
    if (/\{\{\d+\}\}/.test(part)) {
      return (
        <span
          key={index}
          className="rounded bg-yellow-100 px-1 font-mono text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          {part}
        </span>
      )
    }
    return part
  })
}

export function TemplateDetailDialog({
  open,
  onOpenChange,
  template,
}: TemplateDetailDialogProps) {
  const t = useTranslations("templates.templateDetail")
  const tList = useTranslations("templates.templateList")

  if (!template) return null

  const variableCount = countTemplateVariables(template)
  const isDynamicUrl = hasDynamicUrl(template)
  const HeaderIcon = template.headerType
    ? headerTypeIcons[template.headerType]
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
            <div className="flex items-center gap-1">
              {variableCount > 0 && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Variable className="h-3 w-3" />
                  {tList("variableCount", { count: variableCount })}
                </Badge>
              )}
              {isDynamicUrl && (
                <Badge
                  variant="outline"
                  className="gap-1 border-purple-300 text-xs text-purple-600"
                >
                  <Link className="h-3 w-3" />
                  {tList("dynamicUrl")}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {template.category} • {template.language} • {template.status}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Structure */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t("structure")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Header */}
              {template.headerType && (
                <div className="space-y-1">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    {HeaderIcon && <HeaderIcon className="h-4 w-4" />}
                    {t("header")}
                    {["IMAGE", "VIDEO", "DOCUMENT"].includes(
                      template.headerType
                    ) && (
                      <Badge variant="secondary" className="text-xs">
                        {template.headerType}
                      </Badge>
                    )}
                  </div>
                  {template.headerType === "TEXT" && template.headerContent && (
                    <div className="bg-muted rounded-md p-2 text-sm">
                      {highlightVariables(template.headerContent)}
                    </div>
                  )}
                  {["IMAGE", "VIDEO", "DOCUMENT"].includes(
                    template.headerType
                  ) && (
                    <div className="bg-muted text-muted-foreground rounded-md p-2 text-sm italic">
                      Media variable (upload required)
                    </div>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  {t("body")}
                </div>
                <div className="bg-muted rounded-md p-2 text-sm whitespace-pre-wrap">
                  {highlightVariables(template.content)}
                </div>
              </div>

              {/* Footer */}
              {template.footerText && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm font-medium">
                    {t("footer")}
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-md p-2 text-sm">
                    {template.footerText}
                  </div>
                </div>
              )}

              {/* Buttons */}
              {template.components?.some((c) => c.type === "BUTTONS") && (
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm font-medium">
                    {t("buttons")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {template.components
                      .filter((c) => c.type === "BUTTONS")
                      .flatMap((c) => c.buttons || [])
                      .map((button, index) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          {button.type === "URL" && (
                            <Link className="h-3 w-3" />
                          )}
                          {button.type === "PHONE_NUMBER" && (
                            <Phone className="h-3 w-3" />
                          )}
                          {button.type === "QUICK_REPLY" && (
                            <MessageSquare className="h-3 w-3" />
                          )}
                          {button.text}
                          {button.type === "URL" &&
                            button.example &&
                            button.example.length > 0 && (
                              <span className="text-xs text-purple-600">
                                (dynamic)
                              </span>
                            )}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

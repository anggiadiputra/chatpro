import type { VariableType, TemplateVariable, TemplateVariableMapping } from '@prisma/client';

/**
 * WhatsApp Template Component Types
 */
export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
  buttons?: WhatsAppTemplateButton[];
}

export interface WhatsAppTemplateButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[]; // For dynamic URL suffix
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: WhatsAppTemplateComponent[];
}

/**
 * Rendered Template for Preview
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export interface RenderedTemplate {
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    content: string;
  };
  body: string;
  footer?: string;
  buttons?: Array<{
    type: 'url' | 'phone_number' | 'quick_reply';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

/**
 * WhatsApp API Template Payload
 * Requirements: 4.2, 4.3
 */
export interface WhatsAppTemplatePayload {
  name: string;
  language: { code: string };
  components: WhatsAppTemplateComponentPayload[];
}

export interface WhatsAppTemplateComponentPayload {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url'; // For URL buttons
  index?: number; // For buttons
  parameters?: WhatsAppTemplateParameter[];
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'image' | 'video' | 'document' | 'currency' | 'date_time';
  text?: string;
  image?: { id?: string; link?: string };
  video?: { id?: string; link?: string };
  document?: { id?: string; link?: string; filename?: string };
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
}

/**
 * Variable mapping with variable details
 */
export interface MappingWithVariable extends TemplateVariableMapping {
  variable: TemplateVariable;
}

/**
 * Variable value map for rendering
 */
export interface VariableValueMap {
  [variableId: string]: string;
}

/**
 * Error codes for template rendering
 */
export const TEMPLATE_RENDERER_ERRORS = {
  MISSING_VARIABLE_VALUE: 'Missing value for required variable',
  INVALID_TEMPLATE_STRUCTURE: 'Invalid template structure',
  MISSING_MAPPING: 'No mapping found for variable position',
  INVALID_MEDIA_TYPE: 'Invalid media type for header',
} as const;

/**
 * TemplateRendererService
 * 
 * Handles template rendering for preview and building WhatsApp API payloads.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.2, 4.3
 */
export class TemplateRendererService {
  // ============================================
  // Template Rendering for Preview (Requirements: 3.1, 3.2, 3.3, 3.4)
  // ============================================

  /**
   * Render template with variable values for preview
   * 
   * @param template - WhatsApp template structure
   * @param variableValues - Map of variableId to value
   * @param mappings - Variable mappings for the template
   * @returns Rendered template for preview
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  renderTemplate(
    template: WhatsAppTemplate,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): RenderedTemplate {
    const result: RenderedTemplate = {
      body: '',
    };

    for (const component of template.components) {
      switch (component.type) {
        case 'HEADER':
          result.header = this.renderHeader(component, variableValues, mappings);
          break;
        case 'BODY':
          result.body = this.renderBody(component, variableValues, mappings);
          break;
        case 'FOOTER':
          result.footer = component.text || '';
          break;
        case 'BUTTONS':
          result.buttons = this.renderButtons(component, variableValues, mappings);
          break;
      }
    }

    return result;
  }

  /**
   * Render header component
   * Requirements: 3.3
   */
  private renderHeader(
    component: WhatsAppTemplateComponent,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): RenderedTemplate['header'] {
    const format = component.format?.toLowerCase() as 'text' | 'image' | 'video' | 'document';
    
    if (format === 'text') {
      // Text header with possible variables
      const headerMappings = mappings.filter(m => m.componentType === 'header');
      const text = this.replaceVariablesInText(
        component.text || '',
        headerMappings,
        variableValues
      );
      return { type: 'text', content: text };
    }
    
    // Media header (image, video, document)
    const headerMapping = mappings.find(
      m => m.componentType === 'header' && m.parameterIndex === 0
    );
    
    if (headerMapping && variableValues[headerMapping.variableId]) {
      return {
        type: format || 'image',
        content: variableValues[headerMapping.variableId],
      };
    }
    
    // Return example or empty
    return {
      type: format || 'image',
      content: component.example?.header_handle?.[0] || '',
    };
  }

  /**
   * Render body component with variable replacement
   * Requirements: 3.2
   */
  private renderBody(
    component: WhatsAppTemplateComponent,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): string {
    const bodyMappings = mappings.filter(m => m.componentType === 'body');
    return this.replaceVariablesInText(
      component.text || '',
      bodyMappings,
      variableValues
    );
  }

  /**
   * Render buttons with dynamic URL construction
   * Requirements: 3.4
   */
  private renderButtons(
    component: WhatsAppTemplateComponent,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): RenderedTemplate['buttons'] {
    if (!component.buttons) return [];

    return component.buttons.map((button, index) => {
      const buttonType = button.type.toLowerCase() as 'url' | 'phone_number' | 'quick_reply';
      
      const result: NonNullable<RenderedTemplate['buttons']>[number] = {
        type: buttonType,
        text: button.text,
      };

      if (buttonType === 'url' && button.url) {
        // Check for dynamic URL variable
        const buttonMapping = mappings.find(
          m => m.componentType === 'button' && m.componentIndex === index
        );
        
        if (buttonMapping && variableValues[buttonMapping.variableId]) {
          // Dynamic URL: base URL + variable suffix
          result.url = button.url.replace('{{1}}', variableValues[buttonMapping.variableId]);
        } else {
          result.url = button.url;
        }
      } else if (buttonType === 'phone_number') {
        result.phoneNumber = button.phone_number;
      }

      return result;
    });
  }

  /**
   * Replace variable placeholders in text with actual values
   * Handles {{1}}, {{2}}, etc. placeholders
   */
  private replaceVariablesInText(
    text: string,
    mappings: MappingWithVariable[],
    variableValues: VariableValueMap
  ): string {
    let result = text;
    
    // Sort mappings by parameterIndex to ensure correct replacement order
    const sortedMappings = [...mappings].sort((a, b) => a.parameterIndex - b.parameterIndex);
    
    for (const mapping of sortedMappings) {
      const placeholder = `{{${mapping.parameterIndex + 1}}}`;
      const value = variableValues[mapping.variableId] || '';
      result = result.replace(placeholder, value);
    }
    
    return result;
  }

  // ============================================
  // WhatsApp API Payload Building (Requirements: 4.2, 4.3)
  // ============================================

  /**
   * Build WhatsApp API payload for sending template
   * 
   * @param templateName - WhatsApp template name
   * @param languageCode - Template language code
   * @param template - WhatsApp template structure
   * @param variableValues - Map of variableId to value
   * @param mappings - Variable mappings for the template
   * @returns WhatsApp API template payload
   * Requirements: 4.2, 4.3
   */
  buildTemplatePayload(
    templateName: string,
    languageCode: string,
    template: WhatsAppTemplate,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): WhatsAppTemplatePayload {
    const payload: WhatsAppTemplatePayload = {
      name: templateName,
      language: { code: languageCode },
      components: [],
    };

    for (const component of template.components) {
      switch (component.type) {
        case 'HEADER':
          const headerPayload = this.buildHeaderPayload(component, variableValues, mappings);
          if (headerPayload) {
            payload.components.push(headerPayload);
          }
          break;
        case 'BODY':
          const bodyPayload = this.buildBodyPayload(component, variableValues, mappings);
          if (bodyPayload) {
            payload.components.push(bodyPayload);
          }
          break;
        case 'BUTTONS':
          const buttonPayloads = this.buildButtonPayloads(component, variableValues, mappings);
          payload.components.push(...buttonPayloads);
          break;
        // FOOTER doesn't have variables, so no payload needed
      }
    }

    return payload;
  }

  /**
   * Build header component payload
   * Requirements: 4.2
   */
  private buildHeaderPayload(
    component: WhatsAppTemplateComponent,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): WhatsAppTemplateComponentPayload | null {
    const headerMappings = mappings.filter(m => m.componentType === 'header');
    
    if (headerMappings.length === 0) {
      return null;
    }

    const format = component.format?.toLowerCase();
    const parameters: WhatsAppTemplateParameter[] = [];

    for (const mapping of headerMappings) {
      const value = variableValues[mapping.variableId];
      if (!value) continue;

      const variableType = mapping.variable.type;
      const param = this.buildParameter(variableType, value, format);
      parameters.push(param);
    }

    if (parameters.length === 0) {
      return null;
    }

    return {
      type: 'header',
      parameters,
    };
  }

  /**
   * Build body component payload
   * Requirements: 4.2
   */
  private buildBodyPayload(
    component: WhatsAppTemplateComponent,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): WhatsAppTemplateComponentPayload | null {
    const bodyMappings = mappings
      .filter(m => m.componentType === 'body')
      .sort((a, b) => a.parameterIndex - b.parameterIndex);
    
    if (bodyMappings.length === 0) {
      return null;
    }

    const parameters: WhatsAppTemplateParameter[] = [];

    for (const mapping of bodyMappings) {
      const value = variableValues[mapping.variableId] || '';
      const variableType = mapping.variable.type;
      const param = this.buildParameter(variableType, value);
      parameters.push(param);
    }

    return {
      type: 'body',
      parameters,
    };
  }

  /**
   * Build button component payloads for dynamic URL buttons
   * Requirements: 4.3
   */
  private buildButtonPayloads(
    component: WhatsAppTemplateComponent,
    variableValues: VariableValueMap,
    mappings: MappingWithVariable[]
  ): WhatsAppTemplateComponentPayload[] {
    const payloads: WhatsAppTemplateComponentPayload[] = [];
    
    if (!component.buttons) return payloads;

    for (let index = 0; index < component.buttons.length; index++) {
      const button = component.buttons[index];
      
      // Only URL buttons can have dynamic parameters
      if (button.type !== 'URL') continue;
      
      // Check if this button has a variable mapping
      const buttonMapping = mappings.find(
        m => m.componentType === 'button' && m.componentIndex === index
      );
      
      if (!buttonMapping) continue;
      
      const value = variableValues[buttonMapping.variableId];
      if (!value) continue;

      payloads.push({
        type: 'button',
        sub_type: 'url',
        index,
        parameters: [{
          type: 'text',
          text: value,
        }],
      });
    }

    return payloads;
  }

  /**
   * Build parameter based on variable type
   */
  private buildParameter(
    variableType: VariableType,
    value: string,
    headerFormat?: string
  ): WhatsAppTemplateParameter {
    switch (variableType) {
      case 'IMAGE':
        // Check if value is a media_id (no URL scheme) or a link
        if (this.isMediaId(value)) {
          return { type: 'image', image: { id: value } };
        }
        return { type: 'image', image: { link: value } };
      
      case 'VIDEO':
        if (this.isMediaId(value)) {
          return { type: 'video', video: { id: value } };
        }
        return { type: 'video', video: { link: value } };
      
      case 'DOCUMENT':
        if (this.isMediaId(value)) {
          return { type: 'document', document: { id: value } };
        }
        return { type: 'document', document: { link: value } };
      
      case 'CURRENCY':
        // Parse currency value (expected format: "IDR 100000" or just "100000")
        const currencyMatch = value.match(/^([A-Z]{3})?\s*(\d+(?:\.\d+)?)$/);
        if (currencyMatch) {
          const code = currencyMatch[1] || 'IDR';
          const amount = parseFloat(currencyMatch[2]);
          return {
            type: 'currency',
            currency: {
              fallback_value: value,
              code,
              amount_1000: Math.round(amount * 1000),
            },
          };
        }
        // Fallback to text if parsing fails
        return { type: 'text', text: value };
      
      case 'DATE':
        // Date should be passed as fallback_value
        return {
          type: 'date_time',
          date_time: { fallback_value: value },
        };
      
      case 'URL':
      case 'TEXT':
      default:
        return { type: 'text', text: value };
    }
  }

  /**
   * Check if value is a WhatsApp media_id (not a URL)
   * Media IDs are typically numeric strings without URL scheme
   */
  private isMediaId(value: string): boolean {
    // Media IDs don't contain URL schemes
    return !value.startsWith('http://') && !value.startsWith('https://');
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Extract variable positions from template
   * Useful for creating initial mappings
   */
  extractVariablePositions(template: WhatsAppTemplate): Array<{
    componentType: string;
    componentIndex: number;
    parameterIndex: number;
    format?: string;
  }> {
    const positions: Array<{
      componentType: string;
      componentIndex: number;
      parameterIndex: number;
      format?: string;
    }> = [];

    for (const component of template.components) {
      switch (component.type) {
        case 'HEADER':
          if (component.format === 'TEXT' && component.text) {
            const matches = component.text.match(/\{\{\d+\}\}/g) || [];
            matches.forEach((_, idx) => {
              positions.push({
                componentType: 'header',
                componentIndex: 0,
                parameterIndex: idx,
                format: 'TEXT',
              });
            });
          } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(component.format || '')) {
            // Media headers have one variable position
            positions.push({
              componentType: 'header',
              componentIndex: 0,
              parameterIndex: 0,
              format: component.format,
            });
          }
          break;
        
        case 'BODY':
          if (component.text) {
            const matches = component.text.match(/\{\{\d+\}\}/g) || [];
            matches.forEach((_, idx) => {
              positions.push({
                componentType: 'body',
                componentIndex: 0,
                parameterIndex: idx,
              });
            });
          }
          break;
        
        case 'BUTTONS':
          component.buttons?.forEach((button, buttonIndex) => {
            if (button.type === 'URL' && button.url?.includes('{{1}}')) {
              positions.push({
                componentType: 'button',
                componentIndex: buttonIndex,
                parameterIndex: 0,
              });
            }
          });
          break;
      }
    }

    return positions;
  }

  /**
   * Count total variables in template
   */
  countVariables(template: WhatsAppTemplate): number {
    return this.extractVariablePositions(template).length;
  }
}

// Export singleton instance
export const templateRendererService = new TemplateRendererService();

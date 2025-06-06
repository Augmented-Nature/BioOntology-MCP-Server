#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

// BioOntology API interfaces
interface OntologyInfo {
  '@id': string;
  '@type': string;
  acronym: string;
  name: string;
  administeredBy?: string[];
  flat?: boolean;
  summaryOnly?: boolean;
  ontologyType?: string;
  submissions?: any[];
  projects?: any[];
  notes?: any[];
  reviews?: any[];
  group?: string[];
  hasDomain?: string[];
  links?: {
    [key: string]: string;
  };
}

interface ClassInfo {
  '@id': string;
  '@type': string;
  prefLabel?: string;
  synonym?: string[];
  definition?: string[];
  obsolete?: boolean;
  semanticType?: string[];
  cui?: string[];
  notation?: string;
  prefixIRI?: string;
  parents?: any[];
  children?: any[];
  ancestors?: any[];
  descendants?: any[];
  properties?: any;
  links?: {
    [key: string]: string;
  };
}

// Validation functions
const isValidSearchTermsArgs = (
  args: any
): args is {
  query: string;
  ontologies?: string;
  require_exact_match?: boolean;
  suggest?: boolean;
  also_search_views?: boolean;
  require_definitions?: boolean;
  also_search_properties?: boolean;
  also_search_obsolete?: boolean;
  cui?: string;
  semantic_types?: string;
  include?: string;
  page?: number;
  pagesize?: number;
  language?: string;
} => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.query === 'string' &&
    (args.ontologies === undefined || typeof args.ontologies === 'string') &&
    (args.require_exact_match === undefined || typeof args.require_exact_match === 'boolean') &&
    (args.suggest === undefined || typeof args.suggest === 'boolean') &&
    (args.also_search_views === undefined || typeof args.also_search_views === 'boolean') &&
    (args.require_definitions === undefined || typeof args.require_definitions === 'boolean') &&
    (args.also_search_properties === undefined || typeof args.also_search_properties === 'boolean') &&
    (args.also_search_obsolete === undefined || typeof args.also_search_obsolete === 'boolean') &&
    (args.cui === undefined || typeof args.cui === 'string') &&
    (args.semantic_types === undefined || typeof args.semantic_types === 'string') &&
    (args.include === undefined || typeof args.include === 'string') &&
    (args.page === undefined || (typeof args.page === 'number' && args.page > 0)) &&
    (args.pagesize === undefined || (typeof args.pagesize === 'number' && args.pagesize > 0 && args.pagesize <= 500)) &&
    (args.language === undefined || typeof args.language === 'string')
  );
};

const isValidSearchPropertiesArgs = (
  args: any
): args is {
  query: string;
  ontologies?: string;
  require_exact_match?: boolean;
  also_search_views?: boolean;
  require_definitions?: boolean;
  include?: string;
  ontology_types?: string;
  property_types?: string;
  page?: number;
  pagesize?: number;
} => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.query === 'string' &&
    (args.ontologies === undefined || typeof args.ontologies === 'string') &&
    (args.require_exact_match === undefined || typeof args.require_exact_match === 'boolean') &&
    (args.also_search_views === undefined || typeof args.also_search_views === 'boolean') &&
    (args.require_definitions === undefined || typeof args.require_definitions === 'boolean') &&
    (args.include === undefined || typeof args.include === 'string') &&
    (args.ontology_types === undefined || typeof args.ontology_types === 'string') &&
    (args.property_types === undefined || typeof args.property_types === 'string') &&
    (args.page === undefined || (typeof args.page === 'number' && args.page > 0)) &&
    (args.pagesize === undefined || (typeof args.pagesize === 'number' && args.pagesize > 0 && args.pagesize <= 500))
  );
};

const isValidAnnotateTextArgs = (
  args: any
): args is {
  text: string;
  ontologies?: string;
  semantic_types?: string;
  expand_semantic_types_hierarchy?: boolean;
  expand_class_hierarchy?: boolean;
  class_hierarchy_max_level?: number;
  expand_mappings?: boolean;
  stop_words?: string;
  minimum_match_length?: number;
  exclude_numbers?: boolean;
  whole_word_only?: boolean;
  exclude_synonyms?: boolean;
  longest_only?: boolean;
} => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.text === 'string' &&
    args.text.length > 0 &&
    (args.ontologies === undefined || typeof args.ontologies === 'string') &&
    (args.semantic_types === undefined || typeof args.semantic_types === 'string') &&
    (args.expand_semantic_types_hierarchy === undefined || typeof args.expand_semantic_types_hierarchy === 'boolean') &&
    (args.expand_class_hierarchy === undefined || typeof args.expand_class_hierarchy === 'boolean') &&
    (args.class_hierarchy_max_level === undefined || (typeof args.class_hierarchy_max_level === 'number' && args.class_hierarchy_max_level >= 0)) &&
    (args.expand_mappings === undefined || typeof args.expand_mappings === 'boolean') &&
    (args.stop_words === undefined || typeof args.stop_words === 'string') &&
    (args.minimum_match_length === undefined || (typeof args.minimum_match_length === 'number' && args.minimum_match_length > 0)) &&
    (args.exclude_numbers === undefined || typeof args.exclude_numbers === 'boolean') &&
    (args.whole_word_only === undefined || typeof args.whole_word_only === 'boolean') &&
    (args.exclude_synonyms === undefined || typeof args.exclude_synonyms === 'boolean') &&
    (args.longest_only === undefined || typeof args.longest_only === 'boolean')
  );
};

const isValidRecommendOntologiesArgs = (
  args: any
): args is {
  input: string;
  input_type?: number;
  output_type?: number;
  max_elements_set?: number;
  wc?: number;
  wa?: number;
  wd?: number;
  ws?: number;
  ontologies?: string;
} => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.input === 'string' &&
    args.input.length > 0 &&
    (args.input_type === undefined || (typeof args.input_type === 'number' && [1, 2].includes(args.input_type))) &&
    (args.output_type === undefined || (typeof args.output_type === 'number' && [1, 2].includes(args.output_type))) &&
    (args.max_elements_set === undefined || (typeof args.max_elements_set === 'number' && [2, 3, 4].includes(args.max_elements_set))) &&
    (args.wc === undefined || (typeof args.wc === 'number' && args.wc >= 0 && args.wc <= 1)) &&
    (args.wa === undefined || (typeof args.wa === 'number' && args.wa >= 0 && args.wa <= 1)) &&
    (args.wd === undefined || (typeof args.wd === 'number' && args.wd >= 0 && args.wd <= 1)) &&
    (args.ws === undefined || (typeof args.ws === 'number' && args.ws >= 0 && args.ws <= 1)) &&
    (args.ontologies === undefined || typeof args.ontologies === 'string')
  );
};

const isValidGetOntologyInfoArgs = (
  args: any
): args is { acronym: string; include_views?: boolean } => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.acronym === 'string' &&
    args.acronym.length > 0 &&
    (args.include_views === undefined || typeof args.include_views === 'boolean')
  );
};

const isValidGetClassInfoArgs = (
  args: any
): args is { ontology: string; class_id: string; include?: string } => {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.ontology === 'string' &&
    args.ontology.length > 0 &&
    typeof args.class_id === 'string' &&
    args.class_id.length > 0 &&
    (args.include === undefined || typeof args.include === 'string')
  );
};

const isValidSearchOntologiesArgs = (
  args: any
): args is {
  query?: string;
  also_search_views?: boolean;
  include_views?: boolean;
  display_context?: boolean;
  display_links?: boolean;
} => {
  return (
    typeof args === 'object' &&
    args !== null &&
    (args.query === undefined || typeof args.query === 'string') &&
    (args.also_search_views === undefined || typeof args.also_search_views === 'boolean') &&
    (args.include_views === undefined || typeof args.include_views === 'boolean') &&
    (args.display_context === undefined || typeof args.display_context === 'boolean') &&
    (args.display_links === undefined || typeof args.display_links === 'boolean')
  );
};

const isValidGetAnalyticsArgs = (
  args: any
): args is { month?: number; year?: number; ontology?: string } => {
  return (
    typeof args === 'object' &&
    args !== null &&
    (args.month === undefined || (typeof args.month === 'number' && args.month >= 1 && args.month <= 12)) &&
    (args.year === undefined || (typeof args.year === 'number' && args.year >= 2013)) &&
    (args.ontology === undefined || typeof args.ontology === 'string')
  );
};

class BioOntologyServer {
  private server: Server;
  private apiClient: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.server = new Server(
      {
        name: 'bioontology-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Get API key from environment
    this.apiKey = process.env.BIOONTOLOGY_API_KEY || '';
    if (!this.apiKey) {
      console.error('Warning: BIOONTOLOGY_API_KEY environment variable not set. Some operations may fail.');
    }

    // Initialize BioOntology API client
    this.apiClient = axios.create({
      baseURL: 'https://data.bioontology.org',
      timeout: 60000,
      headers: {
        'User-Agent': 'BioOntology-MCP-Server/0.1.0',
      },
    });

    this.setupResourceHandlers();
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error: any) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupResourceHandlers() {
    // List available resource templates
    this.server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async () => ({
        resourceTemplates: [
          {
            uriTemplate: 'bioontology://ontology/{acronym}',
            name: 'BioOntology ontology information',
            mimeType: 'application/json',
            description: 'Complete ontology information and metadata',
          },
          {
            uriTemplate: 'bioontology://class/{ontology}/{class_id}',
            name: 'Ontology class details',
            mimeType: 'application/json',
            description: 'Detailed class information including hierarchy and properties',
          },
          {
            uriTemplate: 'bioontology://search/{query}',
            name: 'Term search results',
            mimeType: 'application/json',
            description: 'Search results for ontology terms matching the query',
          },
          {
            uriTemplate: 'bioontology://annotations/{text}',
            name: 'Text annotation results',
            mimeType: 'application/json',
            description: 'Ontology term annotations for the provided text',
          },
          {
            uriTemplate: 'bioontology://recommendations/{input}',
            name: 'Ontology recommendations',
            mimeType: 'application/json',
            description: 'Recommended ontologies for the input text or keywords',
          },
          {
            uriTemplate: 'bioontology://analytics/{ontology}',
            name: 'Ontology analytics data',
            mimeType: 'application/json',
            description: 'Usage statistics and analytics for an ontology',
          },
        ],
      })
    );

    // Handle resource requests
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: any) => {
        const uri = request.params.uri;

        // Handle ontology info requests
        const ontologyMatch = uri.match(/^bioontology:\/\/ontology\/([A-Z0-9_-]+)$/i);
        if (ontologyMatch) {
          const acronym = ontologyMatch[1];
          try {
            const response = await this.apiClient.get(`/ontologies/${acronym}`, {
              params: { apikey: this.apiKey },
            });

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to fetch ontology ${acronym}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Handle class info requests
        const classMatch = uri.match(/^bioontology:\/\/class\/([A-Z0-9_-]+)\/(.+)$/i);
        if (classMatch) {
          const ontology = classMatch[1];
          const classId = decodeURIComponent(classMatch[2]);
          try {
            const response = await this.apiClient.get(`/ontologies/${ontology}/classes/${encodeURIComponent(classId)}`, {
              params: { apikey: this.apiKey },
            });

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to fetch class ${classId} from ${ontology}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Handle search requests
        const searchMatch = uri.match(/^bioontology:\/\/search\/(.+)$/);
        if (searchMatch) {
          const query = decodeURIComponent(searchMatch[1]);
          try {
            const response = await this.apiClient.get('/search', {
              params: {
                q: query,
                apikey: this.apiKey,
                pagesize: 25,
              },
            });

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to search for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Handle annotation requests
        const annotationMatch = uri.match(/^bioontology:\/\/annotations\/(.+)$/);
        if (annotationMatch) {
          const text = decodeURIComponent(annotationMatch[1]);
          try {
            const response = await this.apiClient.get('/annotator', {
              params: {
                text: text,
                apikey: this.apiKey,
              },
            });

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to annotate text: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Handle recommendation requests
        const recommendationMatch = uri.match(/^bioontology:\/\/recommendations\/(.+)$/);
        if (recommendationMatch) {
          const input = decodeURIComponent(recommendationMatch[1]);
          try {
            const response = await this.apiClient.get('/recommender', {
              params: {
                input: input,
                apikey: this.apiKey,
              },
            });

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to get recommendations for "${input}": ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        // Handle analytics requests
        const analyticsMatch = uri.match(/^bioontology:\/\/analytics\/([A-Z0-9_-]+)$/i);
        if (analyticsMatch) {
          const ontology = analyticsMatch[1];
          try {
            const response = await this.apiClient.get(`/ontologies/${ontology}/analytics`, {
              params: { apikey: this.apiKey },
            });

            return {
              contents: [
                {
                  uri: request.params.uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(response.data, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to fetch analytics for ${ontology}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid URI format: ${uri}`
        );
      }
    );
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Search & Discovery Tools
        {
          name: 'search_terms',
          description: 'Search across ontology terms with advanced filtering options',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query for ontology terms' },
              ontologies: { type: 'string', description: 'Comma-separated list of ontology acronyms to search in' },
              require_exact_match: { type: 'boolean', description: 'Require exact match (default: false)' },
              suggest: { type: 'boolean', description: 'Enable suggestion mode for type-ahead (default: false)' },
              also_search_views: { type: 'boolean', description: 'Include ontology views in search (default: false)' },
              require_definitions: { type: 'boolean', description: 'Only return terms with definitions (default: false)' },
              also_search_properties: { type: 'boolean', description: 'Search in properties as well (default: false)' },
              also_search_obsolete: { type: 'boolean', description: 'Include obsolete terms (default: false)' },
              cui: { type: 'string', description: 'Comma-separated CUIs to filter by' },
              semantic_types: { type: 'string', description: 'Comma-separated semantic types to filter by' },
              include: { type: 'string', description: 'Comma-separated attributes to include (e.g., prefLabel,synonym,definition)' },
              page: { type: 'number', description: 'Page number (default: 1)', minimum: 1 },
              pagesize: { type: 'number', description: 'Results per page (default: 50, max: 500)', minimum: 1, maximum: 500 },
              language: { type: 'string', description: 'Language code (e.g., en, fr)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_properties',
          description: 'Search ontology properties by their labels and IDs',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query for properties' },
              ontologies: { type: 'string', description: 'Comma-separated list of ontology acronyms' },
              require_exact_match: { type: 'boolean', description: 'Require exact match (default: false)' },
              also_search_views: { type: 'boolean', description: 'Include ontology views (default: false)' },
              require_definitions: { type: 'boolean', description: 'Only return properties with definitions (default: false)' },
              include: { type: 'string', description: 'Attributes to include (default: label,labelGenerated,definition,parents)' },
              ontology_types: { type: 'string', description: 'Ontology types to include (e.g., ONTOLOGY,VALUE_SET_COLLECTION)' },
              property_types: { type: 'string', description: 'Property types (object,annotation,datatype)' },
              page: { type: 'number', description: 'Page number (default: 1)', minimum: 1 },
              pagesize: { type: 'number', description: 'Results per page (default: 50, max: 500)', minimum: 1, maximum: 500 },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_ontologies',
          description: 'Search for ontologies by name, description, or domain',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query for ontologies (optional for listing all)' },
              also_search_views: { type: 'boolean', description: 'Include ontology views (default: false)' },
              include_views: { type: 'boolean', description: 'Include views in results (default: false)' },
              display_context: { type: 'boolean', description: 'Include JSON-LD context (default: true)' },
              display_links: { type: 'boolean', description: 'Include hypermedia links (default: true)' },
            },
            required: [],
          },
        },
        {
          name: 'get_ontology_info',
          description: 'Get detailed information about a specific ontology',
          inputSchema: {
            type: 'object',
            properties: {
              acronym: { type: 'string', description: 'Ontology acronym (e.g., NCIT, GO, MESH)' },
              include_views: { type: 'boolean', description: 'Include ontology views (default: false)' },
            },
            required: ['acronym'],
          },
        },
        // Text Analysis Tools
        {
          name: 'annotate_text',
          description: 'Analyze text and identify relevant ontology terms with configurable parameters',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to annotate with ontology terms' },
              ontologies: { type: 'string', description: 'Comma-separated ontology acronyms to use for annotation' },
              semantic_types: { type: 'string', description: 'Comma-separated semantic types to filter by' },
              expand_semantic_types_hierarchy: { type: 'boolean', description: 'Include children of semantic types (default: false)' },
              expand_class_hierarchy: { type: 'boolean', description: 'Include class ancestors in annotation (default: false)' },
              class_hierarchy_max_level: { type: 'number', description: 'Maximum hierarchy depth (default: 0)', minimum: 0 },
              expand_mappings: { type: 'boolean', description: 'Use manual mappings (UMLS, REST, CUI, OBOXREF) (default: false)' },
              stop_words: { type: 'string', description: 'Comma-separated custom stop words' },
              minimum_match_length: { type: 'number', description: 'Minimum character length for matches', minimum: 1 },
              exclude_numbers: { type: 'boolean', description: 'Exclude numeric matches (default: false)' },
              whole_word_only: { type: 'boolean', description: 'Match whole words only (default: true)' },
              exclude_synonyms: { type: 'boolean', description: 'Exclude synonym matches (default: false)' },
              longest_only: { type: 'boolean', description: 'Return only longest matches (default: false)' },
            },
            required: ['text'],
          },
        },
        {
          name: 'recommend_ontologies',
          description: 'Get ontology recommendations for text or keywords with customizable weights',
          inputSchema: {
            type: 'object',
            properties: {
              input: { type: 'string', description: 'Input text or comma-separated keywords' },
              input_type: { type: 'number', description: 'Input type: 1=text, 2=keywords (default: 1)', enum: [1, 2] },
              output_type: { type: 'number', description: 'Output type: 1=individual ontologies, 2=ontology sets (default: 1)', enum: [1, 2] },
              max_elements_set: { type: 'number', description: 'Max ontologies per set (2-4, default: 3)', enum: [2, 3, 4] },
              wc: { type: 'number', description: 'Weight for coverage criterion (0-1, default: 0.55)', minimum: 0, maximum: 1 },
              wa: { type: 'number', description: 'Weight for acceptance criterion (0-1, default: 0.15)', minimum: 0, maximum: 1 },
              wd: { type: 'number', description: 'Weight for detail criterion (0-1, default: 0.15)', minimum: 0, maximum: 1 },
              ws: { type: 'number', description: 'Weight for specialization criterion (0-1, default: 0.15)', minimum: 0, maximum: 1 },
              ontologies: { type: 'string', description: 'Comma-separated ontology acronyms to limit evaluation to' },
            },
            required: ['input'],
          },
        },
        {
          name: 'batch_annotate',
          description: 'Process multiple texts for annotation efficiently',
          inputSchema: {
            type: 'object',
            properties: {
              texts: { type: 'array', items: { type: 'string' }, description: 'Array of texts to annotate (max 10)', minItems: 1, maxItems: 10 },
              ontologies: { type: 'string', description: 'Comma-separated ontology acronyms' },
              longest_only: { type: 'boolean', description: 'Return only longest matches (default: true)' },
              whole_word_only: { type: 'boolean', description: 'Match whole words only (default: true)' },
            },
            required: ['texts'],
          },
        },
        // Ontology Navigation Tools
        {
          name: 'get_class_info',
          description: 'Get detailed information about a specific ontology class',
          inputSchema: {
            type: 'object',
            properties: {
              ontology: { type: 'string', description: 'Ontology acronym' },
              class_id: { type: 'string', description: 'Class ID/URI (URL-encoded if necessary)' },
              include: { type: 'string', description: 'Comma-separated attributes to include (e.g., prefLabel,definition,parents,children)' },
            },
            required: ['ontology', 'class_id'],
          },
        },
        // Analytics & Metadata Tools
        {
          name: 'get_ontology_metrics',
          description: 'Get usage statistics and quality metrics for an ontology',
          inputSchema: {
            type: 'object',
            properties: {
              ontology: { type: 'string', description: 'Ontology acronym' },
            },
            required: ['ontology'],
          },
        },
        {
          name: 'get_analytics_data',
          description: 'Get visitor statistics and popularity trends with optional date filtering',
          inputSchema: {
            type: 'object',
            properties: {
              month: { type: 'number', description: 'Month (1-12) for specific data', minimum: 1, maximum: 12 },
              year: { type: 'number', description: 'Year for specific data (2013+)', minimum: 2013 },
              ontology: { type: 'string', description: 'Specific ontology acronym (optional)' },
            },
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        // Search & Discovery Tools
        case 'search_terms':
          return this.handleSearchTerms(args);
        case 'search_properties':
          return this.handleSearchProperties(args);
        case 'search_ontologies':
          return this.handleSearchOntologies(args);
        case 'get_ontology_info':
          return this.handleGetOntologyInfo(args);
        // Text Analysis Tools
        case 'annotate_text':
          return this.handleAnnotateText(args);
        case 'recommend_ontologies':
          return this.handleRecommendOntologies(args);
        case 'batch_annotate':
          return this.handleBatchAnnotate(args);
        // Ontology Navigation Tools
        case 'get_class_info':
          return this.handleGetClassInfo(args);
        // Analytics & Metadata Tools
        case 'get_ontology_metrics':
          return this.handleGetOntologyMetrics(args);
        case 'get_analytics_data':
          return this.handleGetAnalyticsData(args);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    });
  }

  // Tool handler implementations
  private async handleSearchTerms(args: any) {
    if (!isValidSearchTermsArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid search terms arguments');
    }

    try {
      const params: any = {
        q: args.query,
        apikey: this.apiKey,
      };

      // Add optional parameters
      if (args.ontologies) params.ontologies = args.ontologies;
      if (args.require_exact_match !== undefined) params.require_exact_match = args.require_exact_match;
      if (args.suggest !== undefined) params.suggest = args.suggest;
      if (args.also_search_views !== undefined) params.also_search_views = args.also_search_views;
      if (args.require_definitions !== undefined) params.require_definitions = args.require_definitions;
      if (args.also_search_properties !== undefined) params.also_search_properties = args.also_search_properties;
      if (args.also_search_obsolete !== undefined) params.also_search_obsolete = args.also_search_obsolete;
      if (args.cui) params.cui = args.cui;
      if (args.semantic_types) params.semantic_types = args.semantic_types;
      if (args.include) params.include = args.include;
      if (args.page) params.page = args.page;
      if (args.pagesize) params.pagesize = args.pagesize;
      if (args.language) params.language = args.language;

      const response = await this.apiClient.get('/search', { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching terms: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSearchProperties(args: any) {
    if (!isValidSearchPropertiesArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid search properties arguments');
    }

    try {
      const params: any = {
        q: args.query,
        apikey: this.apiKey,
      };

      // Add optional parameters
      if (args.ontologies) params.ontologies = args.ontologies;
      if (args.require_exact_match !== undefined) params.require_exact_match = args.require_exact_match;
      if (args.also_search_views !== undefined) params.also_search_views = args.also_search_views;
      if (args.require_definitions !== undefined) params.require_definitions = args.require_definitions;
      if (args.include) params.include = args.include;
      if (args.ontology_types) params.ontology_types = args.ontology_types;
      if (args.property_types) params.property_types = args.property_types;
      if (args.page) params.page = args.page;
      if (args.pagesize) params.pagesize = args.pagesize;

      const response = await this.apiClient.get('/property_search', { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching properties: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSearchOntologies(args: any) {
    if (!isValidSearchOntologiesArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid search ontologies arguments');
    }

    try {
      const params: any = {
        apikey: this.apiKey,
      };

      // Add optional parameters
      if (args.query) params.q = args.query;
      if (args.also_search_views !== undefined) params.also_search_views = args.also_search_views;
      if (args.include_views !== undefined) params.include_views = args.include_views;
      if (args.display_context !== undefined) params.display_context = args.display_context;
      if (args.display_links !== undefined) params.display_links = args.display_links;

      const response = await this.apiClient.get('/ontologies', { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching ontologies: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetOntologyInfo(args: any) {
    if (!isValidGetOntologyInfoArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid ontology info arguments');
    }

    try {
      const params: any = {
        apikey: this.apiKey,
      };

      if (args.include_views !== undefined) params.include_views = args.include_views;

      const response = await this.apiClient.get(`/ontologies/${args.acronym}`, { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching ontology info: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAnnotateText(args: any) {
    if (!isValidAnnotateTextArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid annotate text arguments');
    }

    try {
      const params: any = {
        text: args.text,
        apikey: this.apiKey,
      };

      // Add optional parameters
      if (args.ontologies) params.ontologies = args.ontologies;
      if (args.semantic_types) params.semantic_types = args.semantic_types;
      if (args.expand_semantic_types_hierarchy !== undefined) params.expand_semantic_types_hierarchy = args.expand_semantic_types_hierarchy;
      if (args.expand_class_hierarchy !== undefined) params.expand_class_hierarchy = args.expand_class_hierarchy;
      if (args.class_hierarchy_max_level !== undefined) params.class_hierarchy_max_level = args.class_hierarchy_max_level;
      if (args.expand_mappings !== undefined) params.expand_mappings = args.expand_mappings;
      if (args.stop_words) params.stop_words = args.stop_words;
      if (args.minimum_match_length !== undefined) params.minimum_match_length = args.minimum_match_length;
      if (args.exclude_numbers !== undefined) params.exclude_numbers = args.exclude_numbers;
      if (args.whole_word_only !== undefined) params.whole_word_only = args.whole_word_only;
      if (args.exclude_synonyms !== undefined) params.exclude_synonyms = args.exclude_synonyms;
      if (args.longest_only !== undefined) params.longest_only = args.longest_only;

      const response = await this.apiClient.get('/annotator', { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error annotating text: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleRecommendOntologies(args: any) {
    if (!isValidRecommendOntologiesArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid recommend ontologies arguments');
    }

    try {
      const params: any = {
        input: args.input,
        apikey: this.apiKey,
      };

      // Add optional parameters
      if (args.input_type !== undefined) params.input_type = args.input_type;
      if (args.output_type !== undefined) params.output_type = args.output_type;
      if (args.max_elements_set !== undefined) params.max_elements_set = args.max_elements_set;
      if (args.wc !== undefined) params.wc = args.wc;
      if (args.wa !== undefined) params.wa = args.wa;
      if (args.wd !== undefined) params.wd = args.wd;
      if (args.ws !== undefined) params.ws = args.ws;
      if (args.ontologies) params.ontologies = args.ontologies;

      const response = await this.apiClient.get('/recommender', { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error recommending ontologies: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleBatchAnnotate(args: any) {
    if (!Array.isArray(args.texts) || args.texts.length === 0 || args.texts.length > 10) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid batch annotate arguments - texts must be array of 1-10 items');
    }

    try {
      const results = [];

      for (const text of args.texts) {
        const params: any = {
          text: text,
          apikey: this.apiKey,
        };

        if (args.ontologies) params.ontologies = args.ontologies;
        if (args.longest_only !== undefined) params.longest_only = args.longest_only;
        if (args.whole_word_only !== undefined) params.whole_word_only = args.whole_word_only;

        try {
          const response = await this.apiClient.get('/annotator', { params });
          results.push({ text, annotations: response.data, success: true });
        } catch (error: any) {
          results.push({ text, error: error.message, success: false });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ batch_results: results }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in batch annotation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetClassInfo(args: any) {
    if (!isValidGetClassInfoArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid class info arguments');
    }

    try {
      const params: any = {
        apikey: this.apiKey,
      };

      if (args.include) params.include = args.include;

      const response = await this.apiClient.get(`/ontologies/${args.ontology}/classes/${encodeURIComponent(args.class_id)}`, { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching class info: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetOntologyMetrics(args: any) {
    if (!args.ontology) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid ontology metrics arguments');
    }

    try {
      const params: any = {
        apikey: this.apiKey,
      };

      const response = await this.apiClient.get(`/ontologies/${args.ontology}/metrics`, { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching ontology metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetAnalyticsData(args: any) {
    if (!isValidGetAnalyticsArgs(args)) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid analytics data arguments');
    }

    try {
      const params: any = {
        apikey: this.apiKey,
      };

      if (args.month !== undefined) params.month = args.month;
      if (args.year !== undefined) params.year = args.year;

      let endpoint = '/analytics';
      if (args.ontology) {
        endpoint = `/ontologies/${args.ontology}/analytics`;
      }

      const response = await this.apiClient.get(endpoint, { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('BioOntology MCP server running on stdio');
  }
}

const server = new BioOntologyServer();
server.run().catch(console.error);

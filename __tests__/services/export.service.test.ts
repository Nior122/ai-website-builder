// =============================================================================
// Export Service Tests
// =============================================================================
// Unit tests for multi-format project export.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { generateExport } from '@/features/export/services/export.service';
import { ExportFormatError } from '@/lib/errors';

// ─── Test Data ─────────────────────────────────────────────────────────

const mockProject = {
  id: 'proj_1',
  name: 'Test Project',
  slug: 'test-project',
  description: 'A test project',
  industry: 'Tech',
  businessType: 'SaaS',
  status: 'published' as const,
  customDomain: null,
  thumbnailUrl: null,
  templateId: null,
  globalStyles: { primaryColor: '#000', secondaryColor: '#fff' },
  seo: { title: 'Test' },
  settings: {},
  publishedAt: new Date(),
  ownerId: 'user_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  pages: [
    {
      id: 'page_1',
      slug: 'home',
      title: 'Home',
      metaTitle: 'Home Page',
      metaDescription: 'Welcome',
      isHome: true,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: 'proj_1',
      sections: [
        {
          id: 'sec_1',
          type: 'hero',
          layout: 'centered',
          order: 0,
          content: { headline: 'Welcome', body: 'Hello world' },
          styles: {},
          animations: [],
          images: [],
          visibility: { desktop: true, tablet: true, mobile: true },
          pageId: 'page_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'sec_2',
          type: 'features',
          layout: 'grid',
          order: 1,
          content: { headline: 'Features', items: [] },
          styles: {},
          animations: [],
          images: [],
          visibility: { desktop: true, tablet: true, mobile: true },
          pageId: 'page_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 'page_2',
      slug: 'about',
      title: 'About',
      metaTitle: 'About Us',
      metaDescription: 'About',
      isHome: false,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: 'proj_1',
      sections: [
        {
          id: 'sec_3',
          type: 'text',
          layout: 'left',
          order: 0,
          content: { headline: 'About Us', description: 'We are great' },
          styles: {},
          animations: [],
          images: [],
          visibility: { desktop: true, tablet: true, mobile: true },
          pageId: 'page_2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  ],
} as never;

// ─── Tests ─────────────────────────────────────────────────────────────

describe('ExportService', () => {
  describe('generateExport', () => {
    it('should throw ExportFormatError for unsupported format', async () => {
      await expect(
        generateExport(mockProject, 'invalid' as never)
      ).rejects.toThrow(ExportFormatError);
    });

    describe('Next.js format', () => {
      it('should generate package.json', async () => {
        const files = await generateExport(mockProject, 'nextjs');

        const pkg = files.find((f) => f.path === 'package.json');
        expect(pkg).toBeDefined();
        expect(pkg!.type).toBe('json');
        const parsed = JSON.parse(pkg!.content);
        expect(parsed.name).toBe('test-project');
        expect(parsed.dependencies.next).toBeDefined();
      });

      it('should generate page files for each page', async () => {
        const files = await generateExport(mockProject, 'nextjs');

        const homePage = files.find((f) => f.path === 'app/page.tsx');
        expect(homePage).toBeDefined();
        expect(homePage!.content).toContain('Home Page');

        const aboutPage = files.find((f) => f.path === 'app/about/page.tsx');
        expect(aboutPage).toBeDefined();
      });

      it('should generate global CSS with theme variables', async () => {
        const files = await generateExport(mockProject, 'nextjs');

        const css = files.find((f) => f.path === 'app/globals.css');
        expect(css).toBeDefined();
        expect(css!.content).toContain('--primary-color');
      });
    });

    describe('React format', () => {
      it('should generate App.tsx with imports', async () => {
        const files = await generateExport(mockProject, 'react');

        const app = files.find((f) => f.path === 'src/App.tsx');
        expect(app).toBeDefined();
        expect(app!.content).toContain('import');
        expect(app!.content).toContain('Home');
      });

      it('should generate individual page components', async () => {
        const files = await generateExport(mockProject, 'react');

        const homePage = files.find((f) => f.path === 'src/pages/Home.tsx');
        expect(homePage).toBeDefined();

        const aboutPage = files.find((f) => f.path === 'src/pages/About.tsx');
        expect(aboutPage).toBeDefined();
      });
    });

    describe('HTML format', () => {
      it('should generate index.html for home page', async () => {
        const files = await generateExport(mockProject, 'html');

        const index = files.find((f) => f.path === 'index.html');
        expect(index).toBeDefined();
        expect(index!.content).toContain('<!DOCTYPE html>');
        expect(index!.content).toContain('Home Page');
        expect(index!.type).toBe('html');
      });

      it('should generate separate HTML file for non-home pages', async () => {
        const files = await generateExport(mockProject, 'html');

        const about = files.find((f) => f.path === 'about.html');
        expect(about).toBeDefined();
        expect(about!.content).toContain('About Us');
      });

      it('should include section headlines in HTML', async () => {
        const files = await generateExport(mockProject, 'html');

        const index = files.find((f) => f.path === 'index.html');
        expect(index!.content).toContain('Welcome');
        expect(index!.content).toContain('Features');
      });
    });

    describe('Tailwind format', () => {
      it('should include Tailwind CDN script', async () => {
        const files = await generateExport(mockProject, 'tailwind');

        const index = files.find((f) => f.path === 'index.html');
        expect(index).toBeDefined();
        expect(index!.content).toContain('tailwindcss.com');
      });

      it('should produce same structure as HTML', async () => {
        const htmlFiles = await generateExport(mockProject, 'html');
        const tailwindFiles = await generateExport(mockProject, 'tailwind');

        expect(tailwindFiles).toHaveLength(htmlFiles.length);
        expect(tailwindFiles.map((f) => f.path)).toEqual(htmlFiles.map((f) => f.path));
      });
    });

    describe('Markdown format', () => {
      it('should generate .md files for each page', async () => {
        const files = await generateExport(mockProject, 'markdown');

        expect(files).toHaveLength(2);

        const home = files.find((f) => f.path === 'home.md');
        expect(home).toBeDefined();
        expect(home!.content).toContain('# Home');
        expect(home!.content).toContain('Welcome');
      });

      it('should use section headlines as markdown headings', async () => {
        const files = await generateExport(mockProject, 'markdown');

        const home = files.find((f) => f.path === 'home.md');
        expect(home!.content).toContain('## Welcome');
      });
    });

    describe('JSON format', () => {
      it('should export full project as JSON', async () => {
        const files = await generateExport(mockProject, 'json');

        expect(files).toHaveLength(1);
        expect(files[0].path).toBe('project.json');
        expect(files[0].type).toBe('json');

        const parsed = JSON.parse(files[0].content);
        expect(parsed.id).toBe('proj_1');
        expect(parsed.pages).toHaveLength(2);
      });
    });
  });
});

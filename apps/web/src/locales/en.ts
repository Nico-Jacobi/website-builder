const en = {
    modules: {
        layout: {
            header: {
                subtitlePlaceholder: 'Subtitle',
                ctaPlaceholder: 'CTA',
            },
            heroBanner: {
                subheadingPlaceholder: 'Subheading',
                primaryCtaPlaceholder: 'Primary CTA',
                secondaryCtaPlaceholder: 'Secondary CTA',
            },
        },
        content: {
            textBlock: {
                overlinePlaceholder: 'Overline',
                headingPlaceholder: 'Heading',
                subtextPlaceholder: 'Subtext',
                actionPlaceholder: 'Action',
            },
            mediaText: {
                headingPlaceholder: 'Heading',
            },
            cardRow: {
                addCardLabel: 'Add card',
            },
            cardGrid: {
                addCardLabel: 'Add card',
            },
            spotlight: {
                badgePlaceholder: 'Badge',
                overlinePlaceholder: 'Overline',
                captionPlaceholder: 'Caption',
            },
            featureGrid: {
                headingPlaceholder: 'Heading',
                subheadingPlaceholder: 'Subheading',
            },
            ctaBand: {
                subheadingPlaceholder: 'Subtext',
            },
            testimonial: {
                addItemLabel: 'Add testimonial',
            },
            bentoGrid: {
                addItemLabel: 'Add cell',
            },
            teamGrid: {
                addItemLabel: 'Add member',
            },
            productTour: {
                addItemLabel: 'Add tab',
            },
            faq: {
                addItemLabel: 'Add FAQ item',
            },
            pricing: {
                addItemLabel: 'Add pricing tier',
            },
            timeline: {
                addItemLabel: 'Add timeline entry',
            },
        },
        media: {
            imageBlock: {
                captionPlaceholder: 'Caption',
            },
            gallery: {
                headingPlaceholder: 'Heading',
                subheadingPlaceholder: 'Subtext',
                addImageLabel: 'Add image',
                removeImageLabel: 'Remove image',
                captionPlaceholder: 'Caption',
            },
            logoStrip: {
                headingPlaceholder: 'Trusted by leading teams',
                partnerLogosAriaLabel: 'Partner logos',
            },
            marquee: {
                addItemLabel: 'Add item',
            },
        },
        shared: {
            card: {
                bodyPlaceholder: 'Card text',
            },
        },
    },

    editor: {
        loading: 'Loading editor…',
        loadError: 'Error loading: {{message}}',
        generatingLabel: 'Generating your website… approx. 18s',
        blockOverlay: {
            moveUpLabel: 'Move block up',
            moveDownLabel: 'Move block down',
            deleteLabel: 'Delete block',
        },
        image: {
            addPlaceholder: 'Add image',
            swapLabel: 'Swap image',
            chooseFileLabel: 'Choose file',
            uploadingLabel: 'Uploading…',
            orUrlLabel: 'Or enter a URL:',
            urlPlaceholder: 'Enter image URL…',
            altPlaceholder: 'Alt text (accessibility)…',
        },
        palette: {
            title: 'Modules',
            ariaLabel: 'Module palette',
            collapsedAriaLabel: 'Module palette (closed)',
            openAriaLabel: 'Open module palette (enables edit mode)',
            openLabel: 'Open module palette',
            categoryLayout: 'Layout',
            categoryContent: 'Content',
            categoryMedia: 'Media',
            categoryOther: 'Other',
        },
        header: {
            siteNamePlaceholder: 'Site name',
            siteNameAriaLabel: 'Site name',
            openInNewTabLabel: 'Open in new tab',
        },
        modeToggle: {
            ariaLabel: 'Toggle view',
            editLabel: 'Edit',
            previewLabel: 'Preview',
        },
        themeToggle: {
            ariaLabel: 'Toggle dark mode',
        },
        saveStatus: {
            saving: 'Saving…',
            saved: 'Saved',
            error: 'Save error',
            idle: 'Ready',
        },
        chat: {
            thinkingLabel: 'thinking',
            emptyTitle: 'Refine your site',
            emptyBody: 'Describe any change in plain language — sections, copy, colors, layout. I will apply it live.',
            inputPlaceholder: 'Describe changes… (↵ send)',
            inputAriaLabel: 'Chat input',
            submitAriaLabel: 'Send',
            submitLabel: 'Send',
            noChanges: 'No changes applied.',
            siteGenerated: 'Website generated in {{seconds}}s.',
            pageUpdated: 'Page {{pagePath}} updated ({{n}} op(s)).',
            changesApplied: 'Applied: {{n}} change(s).',
            partialApply: 'Partially applied: {{n}} change(s) before error.',
            conflictWarning: 'Note: {{n}} LLM change(s) discarded (conflicts).',
            ok: 'Ok.',
            landingDone: 'Landing generated in {{dur}}; generating {{n}} subpage(s)…',
            subpageDone: 'Page {{path}} done ({{dur}})',
            subpageFailed: 'Page {{path}} failed: {{reason}}. Use Retry in the sidebar.',
            complete: 'Site fully generated.',
            generationFailed: 'Generation failed: {{reason}}',
            errorNoApiKey: 'No API key set in backend. Please set ANTHROPIC_API_KEY.',
            errorApiCall: 'LLM call failed: {{message}}',
            errorSafetyBlock: 'LLM response blocked: {{message}}',
            errorInvalidJson: 'LLM returned invalid JSON: {{message}}',
            errorValidationFailed: 'LLM response is not a valid spec ({{count}} errors).',
        },
        pageSwitcher: {
            title: 'Pages',
            generatingAriaLabel: 'generating',
            retryLabel: 'Retry',
            removePageAriaLabel: 'Remove page',
            noPages: 'No pages yet.',
            addPageLabel: '+ Add page',
            confirmDelete: 'Really delete page "{{name}}"?\nThis action cannot be undone.',
            statusPending: 'pending',
            statusGenerating: 'generating',
            statusReady: 'ready',
            statusFailed: 'failed',
        },
        addPageDialog: {
            title: 'Add page',
            ariaLabel: 'Add page',
            pathLabel: 'Path',
            titleLabel: 'Title',
            intentLabel: 'Description',
            submitting: 'Adding…',
            submit: 'Add page',
            errorInvalidPath: 'Path must start with "/".',
            errorPathExists: 'Path "{{path}}" already exists.',
            errorTitleRequired: 'Title is required.',
            errorIntentRequired: 'Description is required.',
        },
    },

    builder: {
        title: 'Your Websites',
        subtitle: 'Create, edit, and publish sites via chat.',
        newSiteLabel: 'New site',
        sitesList: {
            title: 'Saved sites',
            refreshLabel: 'Refresh',
            empty: 'No saved sites yet.',
            editLabel: 'Edit',
            editAriaLabel: 'Edit {{name}}',
            deleteLabel: 'Delete',
            deleteAriaLabel: 'Delete {{name}}',
            confirmDelete: 'Really delete site "{{name}}"?\nThis action cannot be undone.',
        },
        newSiteDialog: {
            title: 'New site',
            nameLabel: 'Name',
            descriptionLabel: 'Description',
            descriptionPlaceholder: 'e.g. An online shop for handmade candles…',
            submitting: 'Creating…',
            submit: 'Create',
        },
    },

    landing: {
        nav: {
            dashboardLabel: 'Dashboard',
        },
        hero: {
            badge: 'AI-powered website builder',
            headlineLine1: 'Your website, live today —',
            headlineLine2: 'no code, no hosting hassle',
            sub: 'Describe your site and AI builds it in seconds. Refine it with chat or a visual drag-and-drop editor. Publish with one click — we handle hosting, SSL, and uptime.',
        },
        prompt: {
            hint: '⌘ + Enter to submit',
            placeholder: 'e.g. A portfolio site for a freelance architect — warm and minimal tone, hero with a tagline, project showcase, about section, client testimonials, and a contact form. Target audience is upscale residential clients...',
            submitting: 'Creating…',
            submit: 'Generate site',
        },
        features: {
            overline: 'Everything you need',
            heading: 'From idea to live site — fully managed',
            sub: 'OnePaige handles the whole journey: AI generation, visual editing, one-click deployment, and ongoing site management.',
            aiTitle: 'AI-Powered Generation',
            aiBody: 'Describe your site in plain language. AI assembles a complete, multi-page, fully themed website in seconds.',
            componentsTitle: 'Rich Module Library',
            componentsBody: 'Dozens of production-ready sections — Hero, Pricing, FAQ, Team, Timeline, Contact and more.',
            editingTitle: 'Visual Editor',
            editingBody: 'Click any text or image to edit it inline. Drag sections to reorder. No code, no forms — just point and click.',
            chatTitle: 'AI Chat Refinement',
            chatBody: 'Describe any change in plain language and AI applies it live — copy, layout, colors, or whole new sections.',
            hostingTitle: 'Managed Hosting',
            hostingBody: 'One-click publish. We manage servers, SSL certificates, and uptime so you never touch infrastructure.',
            adminTitle: 'Admin Portal',
            adminBody: 'Your site is never locked in. Change layouts, upload images, edit text, or fully redesign — plus view contact submissions, all from your dashboard.',
        },
        howItWorks: {
            overline: 'How it works',
            heading: 'From idea to live site in minutes',
            step1Title: 'Describe your site',
            step1Body: 'Type a prompt — your business, audience, and tone. AI plans and generates a complete multi-page website.',
            step2Title: 'Edit your way',
            step2Body: 'Refine with AI chat or use the visual editor to click, drag, and rearrange. No code needed.',
            step3Title: 'Publish & manage',
            step3Body: 'Deploy with one click. We handle hosting and SSL. Use the admin portal anytime to fully edit your site — change layouts, upload images, update text — and view contact submissions.',
        },
        cta: {
            heading: 'Ready to build something?',
            sub: 'Describe your site and have it live in minutes — no technical skills required.',
            button: 'Start building',
        },
        footer: {
            copy: '© 2025 OnePaige. All rights reserved.',
        },
        suggestions: {
            0: 'Portfolio site for a freelance graphic designer',
            1: 'Local bakery homepage with menu and contact info',
            2: 'Personal blog about hiking and outdoor adventures',
            3: 'Startup homepage for an AI-powered code review tool',
        },
    },

    common: {
        cancelLabel: 'Cancel',
        closeAriaLabel: 'Close',
        backLabel: 'Back',
        loadingLabel: 'Loading…',
    },
} as const;

export default en;

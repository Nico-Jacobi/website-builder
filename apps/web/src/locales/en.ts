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
        saveStatus: {
            saving: 'Saving…',
            saved: 'Saved',
            error: 'Save error',
            idle: 'Ready',
        },
        chat: {
            thinkingLabel: 'thinking',
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
            subpageFailed: 'Page {{path}} failed: {{reason}}.',
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

    common: {
        cancelLabel: 'Cancel',
        closeAriaLabel: 'Close',
        backLabel: 'Back',
        loadingLabel: 'Loading…',
    },
} as const;

export default en;

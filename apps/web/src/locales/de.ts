const de = {
    modules: {
        layout: {
            header: {
                subtitlePlaceholder: 'Untertitel',
                ctaPlaceholder: 'CTA',
            },
            heroBanner: {
                subheadingPlaceholder: 'Unterüberschrift',
                primaryCtaPlaceholder: 'Primäre Aktion',
                secondaryCtaPlaceholder: 'Sekundäre Aktion',
            },
        },
        content: {
            textBlock: {
                overlinePlaceholder: 'Kurztitel',
                headingPlaceholder: 'Überschrift',
                subtextPlaceholder: 'Untertext',
                actionPlaceholder: 'Aktion',
            },
            mediaText: {
                headingPlaceholder: 'Überschrift',
            },
            cardRow: {
                addCardLabel: 'Karte hinzufügen',
            },
            cardGrid: {
                addCardLabel: 'Karte hinzufügen',
            },
            spotlight: {
                badgePlaceholder: 'Badge',
                overlinePlaceholder: 'Kurztitel',
                captionPlaceholder: 'Bildunterschrift',
            },
            featureGrid: {
                headingPlaceholder: 'Überschrift',
                subheadingPlaceholder: 'Unterüberschrift',
            },
            ctaBand: {
                subheadingPlaceholder: 'Untertext',
            },
            testimonial: {
                addItemLabel: 'Testimonial hinzufügen',
            },
            bentoGrid: {
                addItemLabel: 'Zelle hinzufügen',
            },
            teamGrid: {
                addItemLabel: 'Mitglied hinzufügen',
            },
            productTour: {
                addItemLabel: 'Tab hinzufügen',
            },
            faq: {
                addItemLabel: 'FAQ-Eintrag hinzufügen',
            },
            pricing: {
                addItemLabel: 'Preisstufe hinzufügen',
            },
            timeline: {
                addItemLabel: 'Zeitleisteneintrag hinzufügen',
            },
        },
        media: {
            imageBlock: {
                captionPlaceholder: 'Bildunterschrift',
            },
            gallery: {
                headingPlaceholder: 'Überschrift',
                subheadingPlaceholder: 'Untertext',
                addImageLabel: 'Bild hinzufügen',
                removeImageLabel: 'Bild entfernen',
                captionPlaceholder: 'Bildunterschrift',
            },
            logoStrip: {
                headingPlaceholder: 'Vertraut von führenden Teams',
                partnerLogosAriaLabel: 'Partner-Logos',
            },
            marquee: {
                addItemLabel: 'Element hinzufügen',
            },
        },
        shared: {
            card: {
                bodyPlaceholder: 'Kartentext',
            },
        },
    },

    editor: {
        loading: 'Lade Editor…',
        loadError: 'Fehler beim Laden: {{message}}',
        generatingLabel: 'Generiere deine Website… ca. 18s',
        blockOverlay: {
            moveUpLabel: 'Block nach oben',
            moveDownLabel: 'Block nach unten',
            deleteLabel: 'Block löschen',
        },
        image: {
            addPlaceholder: 'Bild hinzufügen',
            swapLabel: 'Bild tauschen',
            chooseFileLabel: 'Bild wählen',
            uploadingLabel: 'Wird hochgeladen…',
            orUrlLabel: 'Oder URL eintragen:',
            urlPlaceholder: 'Bild-URL eingeben…',
            altPlaceholder: 'Alt-Text (Barrierefreiheit)…',
        },
        palette: {
            title: 'Module',
            ariaLabel: 'Modul-Palette',
            collapsedAriaLabel: 'Modul-Palette (geschlossen)',
            openAriaLabel: 'Modul-Palette öffnen (aktiviert Bearbeitungsmodus)',
            openLabel: 'Modul-Palette öffnen',
            categoryLayout: 'Layout',
            categoryContent: 'Inhalt',
            categoryMedia: 'Medien',
            categoryOther: 'Sonstige',
        },
        header: {
            siteNamePlaceholder: 'Site-Name',
            siteNameAriaLabel: 'Site-Name',
            openInNewTabLabel: 'In neuem Tab öffnen',
        },
        modeToggle: {
            ariaLabel: 'Ansicht umschalten',
            editLabel: 'Bearbeiten',
            previewLabel: 'Vorschau',
        },
        themeToggle: {
            ariaLabel: 'Dark Mode umschalten',
        },
        saveStatus: {
            saving: 'Speichern…',
            saved: 'Gespeichert',
            error: 'Fehler beim Speichern',
            idle: 'Bereit',
        },
        chat: {
            thinkingLabel: 'denkt nach',
            emptyTitle: 'Website verfeinern',
            emptyBody: 'Beschreibe jede Änderung in normaler Sprache — Abschnitte, Texte, Farben, Layout. Ich wende sie live an.',
            inputPlaceholder: 'Änderungen beschreiben… (↵ senden)',
            inputAriaLabel: 'Chat-Eingabe',
            submitAriaLabel: 'Senden',
            submitLabel: 'Senden',
            noChanges: 'Keine Änderungen angewendet.',
            siteGenerated: 'Website nach {{seconds}}s generiert.',
            pageUpdated: 'Page {{pagePath}} aktualisiert ({{n}} Op(s)).',
            changesApplied: 'Angewendet: {{n}} Änderung(en).',
            partialApply: 'Teilweise angewendet: {{n}} Änderung(en) vor Fehler abgebrochen.',
            conflictWarning: 'Hinweis: {{n}} Änderung(en) des LLM verworfen (Konflikte).',
            ok: 'Ok.',
            landingDone: 'Landing generiert in {{dur}}; {{n}} Subpage(s) werden generiert…',
            subpageDone: 'Page {{path}} fertig ({{dur}})',
            subpageFailed: 'Page {{path}} fehlgeschlagen: {{reason}}. Nutze Wiederholen in der Seitenleiste.',
            complete: 'Site komplett generiert.',
            generationFailed: 'Generation fehlgeschlagen: {{reason}}',
            errorNoApiKey: 'Kein API-Key im Backend gesetzt. Bitte ANTHROPIC_API_KEY setzen.',
            errorApiCall: 'LLM-Aufruf fehlgeschlagen: {{message}}',
            errorSafetyBlock: 'LLM-Antwort blockiert: {{message}}',
            errorInvalidJson: 'LLM hat kein gültiges JSON geliefert: {{message}}',
            errorValidationFailed: 'LLM-Antwort ist keine gültige Spec ({{count}} Fehler).',
        },
        pageSwitcher: {
            title: 'Pages',
            generatingAriaLabel: 'generiere',
            retryLabel: 'Wiederholen',
            removePageAriaLabel: 'Seite entfernen',
            noPages: 'Noch keine Seiten.',
            addPageLabel: '+ Seite hinzufügen',
            confirmDelete: 'Seite "{{name}}" wirklich löschen?\nDiese Aktion kann nicht rückgängig gemacht werden.',
            statusPending: 'ausstehend',
            statusGenerating: 'generiere',
            statusReady: 'fertig',
            statusFailed: 'fehlgeschlagen',
        },
        addPageDialog: {
            title: 'Seite hinzufügen',
            ariaLabel: 'Seite hinzufügen',
            pathLabel: 'Pfad',
            titleLabel: 'Titel',
            intentLabel: 'Beschreibung',
            submitting: 'Wird hinzugefügt…',
            submit: 'Hinzufügen',
            errorInvalidPath: 'Pfad muss mit "/" beginnen.',
            errorPathExists: 'Pfad "{{path}}" existiert bereits.',
            errorTitleRequired: 'Titel ist erforderlich.',
            errorIntentRequired: 'Beschreibung ist erforderlich.',
        },
    },

    builder: {
        title: 'Deine Websites',
        subtitle: 'Erstelle, bearbeite und veröffentliche Sites im Chat.',
        newSiteLabel: 'Neue Site',
        sitesList: {
            title: 'Gespeicherte Sites',
            refreshLabel: 'Aktualisieren',
            empty: 'Noch keine gespeicherte Seite.',
            editLabel: 'Bearbeiten',
            editAriaLabel: '{{name}} bearbeiten',
            deleteLabel: 'Löschen',
            deleteAriaLabel: '{{name}} löschen',
            confirmDelete: 'Site „{{name}}" wirklich löschen?\nDiese Aktion kann nicht rückgängig gemacht werden.',
        },
        newSiteDialog: {
            title: 'Neue Site',
            nameLabel: 'Name',
            descriptionLabel: 'Beschreibung',
            descriptionPlaceholder: 'z.B. Ein Online-Shop für handgemachte Kerzen…',
            submitting: 'Erstelle…',
            submit: 'Erstellen',
        },
    },

    landing: {
        nav: {
            dashboardLabel: 'Dashboard',
        },
        hero: {
            badge: 'KI-gestützter Website-Builder',
            headlineLine1: 'Deine Website, heute online —',
            headlineLine2: 'kein Code, kein Hosting-Stress',
            sub: 'Beschreibe deine Website und die KI erstellt sie in Sekunden. Verfeinere sie per Chat oder mit dem visuellen Drag-and-Drop-Editor. Mit einem Klick veröffentlichen – wir kümmern uns um Hosting, SSL und Betrieb.',
        },
        prompt: {
            hint: '⌘ + Enter zum Absenden',
            placeholder: 'z.B. Eine Portfolio-Website für eine freiberufliche Architektin – warmer, minimalistischer Stil, Hero mit Tagline, Projekt-Showcase, Über-mich-Bereich, Kundenreferenzen und Kontaktformular. Zielgruppe sind gehobene Privatkunden...',
            submitting: 'Erstelle…',
            submit: 'Website generieren',
        },
        features: {
            overline: 'Alles, was du brauchst',
            heading: 'Von der Idee zur fertigen Website – vollständig verwaltet',
            sub: 'OnePaige begleitet dich durch den gesamten Prozess: KI-Generierung, visuelles Editing, Ein-Klick-Deployment und laufende Verwaltung.',
            aiTitle: 'KI-gestützte Generierung',
            aiBody: 'Beschreibe deine Website in natürlicher Sprache. Die KI erstellt in Sekunden eine vollständige, mehrseitige und thematisch stimmige Website.',
            componentsTitle: 'Umfangreiche Modulbibliothek',
            componentsBody: 'Dutzende produktionsfertige Abschnitte – Hero, Pricing, FAQ, Team, Timeline, Kontakt und mehr.',
            editingTitle: 'Visueller Editor',
            editingBody: 'Klicke auf beliebige Texte oder Bilder und bearbeite sie direkt. Abschnitte per Drag-and-Drop verschieben. Kein Code, keine Formulare.',
            chatTitle: 'KI-Chat-Verfeinerung',
            chatBody: 'Beschreibe Änderungen in normaler Sprache – Texte, Layout, Farben oder ganze neue Abschnitte. Die KI setzt sie live um.',
            hostingTitle: 'Verwaltetes Hosting',
            hostingBody: 'Mit einem Klick veröffentlichen. Wir verwalten Server, SSL-Zertifikate und Betrieb – du musst dich um keine Infrastruktur kümmern.',
            adminTitle: 'Admin-Portal',
            adminBody: 'Deine Website bleibt immer editierbar. Layouts ändern, Bilder hochladen, Texte anpassen oder komplett neu gestalten – plus Kontakteinsendungen einsehen, alles in deinem Dashboard.',
        },
        howItWorks: {
            overline: 'So funktioniert es',
            heading: 'Von der Idee zur fertigen Website in Minuten',
            step1Title: 'Website beschreiben',
            step1Body: 'Schreibe einen Prompt – dein Unternehmen, Zielgruppe und Stil. Die KI plant und generiert eine vollständige, mehrseitige Website.',
            step2Title: 'Nach deinen Wünschen bearbeiten',
            step2Body: 'Verfeinere per KI-Chat oder nutze den visuellen Editor zum Klicken, Ziehen und Anordnen. Kein Code erforderlich.',
            step3Title: 'Veröffentlichen & verwalten',
            step3Body: 'Mit einem Klick deployen. Wir kümmern uns um Hosting und SSL. Nutze das Admin-Portal jederzeit, um deine Website vollständig zu bearbeiten – Layouts, Bilder, Texte – und Kontakteinsendungen einzusehen.',
        },
        cta: {
            heading: 'Bereit, etwas zu bauen?',
            sub: 'Beschreibe deine Website und sei in Minuten online – ohne technische Vorkenntnisse.',
            button: 'Loslegen',
        },
        footer: {
            copy: '© 2025 OnePaige. Alle Rechte vorbehalten.',
        },
        suggestions: {
            0: 'Portfolio-Website für einen freiberuflichen Grafikdesigner',
            1: 'Homepage einer lokalen Bäckerei mit Menü und Kontakt',
            2: 'Persönlicher Blog über Wandern und Outdoor-Abenteuer',
            3: 'Startup-Startseite für ein KI-gestütztes Code-Review-Tool',
        },
    },

    common: {
        cancelLabel: 'Abbrechen',
        closeAriaLabel: 'Schließen',
        backLabel: 'Zurück',
        loadingLabel: 'Lädt…',
    },
} as const;

export default de;

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
                headingPlaceholder: 'Trusted by leading teams',
                partnerLogosAriaLabel: 'Partner-Logos',
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
        saveStatus: {
            saving: 'Speichern…',
            saved: 'Gespeichert',
            error: 'Fehler beim Speichern',
            idle: 'Bereit',
        },
        chat: {
            thinkingLabel: 'denkt nach',
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
            subpageFailed: 'Page {{path}} fehlgeschlagen: {{reason}}.',
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

    common: {
        cancelLabel: 'Abbrechen',
        closeAriaLabel: 'Schließen',
        backLabel: 'Zurück',
        loadingLabel: 'Lädt…',
    },
} as const;

export default de;

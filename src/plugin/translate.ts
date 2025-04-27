import type {App, DirectiveBinding, Plugin} from 'vue'

interface TranslationOptions {
    [language: string]: {
        [key: string]: string
    }
}

interface TranslateParams {
    [key: string]: string | number
}

const translations: TranslationOptions = {
    en: {
        greeting: 'Hello, welcome!',
        farewell: 'Goodbye, see you soon!',
        show_question: 'Show Question',
        question: 'How are you today?',
        statement: 'The weather is nice.',
        instruction: 'Please click the button.'
    }
}

const DEFAULT_LANGUAGE = 'en'

const translate = (key: string, language: string = DEFAULT_LANGUAGE): string => {
    const lang = language in translations ? language : DEFAULT_LANGUAGE
    const langTranslations = translations[lang]

    if (langTranslations && key in langTranslations) {
        return langTranslations[key]
    }

    return key
}

const translatePlugin: Plugin = {
    install(app: App) {
        app.config.globalProperties.$translate = (
            key: string,
            params: TranslateParams = {},
            language: string = DEFAULT_LANGUAGE
        ): string => {
            let translation = translate(key, language)

            if (Object.keys(params).length) {
                Object.keys(params).forEach(param => {
                    translation = translation.replace(`{${param}}`, String(params[param]))
                })
            }

            return translation
        }

        app.directive('t', {
            beforeMount(el: HTMLElement, binding: DirectiveBinding<string | { key: string; lang?: string }>) {
                let key: string
                let lang = DEFAULT_LANGUAGE

                if (typeof binding.value === 'string') {
                    key = binding.value
                } else {
                    key = binding.value.key
                    lang = binding.value.lang || DEFAULT_LANGUAGE
                }

                el.textContent = translate(key, lang)
            },
            updated(el: HTMLElement, binding: DirectiveBinding<string | { key: string; lang?: string }>) {
                let key: string
                let lang = DEFAULT_LANGUAGE

                if (typeof binding.value === 'string') {
                    key = binding.value
                } else {
                    key = binding.value.key
                    lang = binding.value.lang || DEFAULT_LANGUAGE
                }

                el.textContent = translate(key, lang)
            }
        })

        app.provide('translate', (
            key: string,
            params: TranslateParams = {},
            language: string = DEFAULT_LANGUAGE
        ): string => {
            let translation = translate(key, language)

            if (Object.keys(params).length) {
                Object.keys(params).forEach(param => {
                    translation = translation.replace(`{${param}}`, String(params[param]))
                })
            }

            return translation
        })
    }
}

export default translatePlugin

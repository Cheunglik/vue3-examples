import type {App} from 'vue'
import translatePlugin from './translate.ts'

export default function addPlugins(app: App): void {
    app.use(translatePlugin)
}

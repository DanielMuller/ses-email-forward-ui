import { Translations } from '@aws-amplify/ui-components'
import amplifyAuthErrorStrings from './authErrorStrings'
import amplifyAuthStrings from './authStrings'
import amplifyInteractionsStrings from './interactionsStrings'

const amplifyTranslations = {}
for (const [key, value] of Object.entries(amplifyAuthErrorStrings)) {
  amplifyTranslations[Translations[key]] = value
}
for (const [key, value] of Object.entries(amplifyAuthStrings)) {
  amplifyTranslations[Translations[key]] = value
}
for (const [key, value] of Object.entries(amplifyInteractionsStrings)) {
  amplifyTranslations[Translations[key]] = value
}
// Add missing translations for error messages
amplifyTranslations['User does not exist.'] = 'Utilisateur inexistant'
amplifyTranslations['Custom auth lambda trigger is not configured for the user pool.'] = 'Le mot de passe ne peut pas être vide'
amplifyTranslations['Incorrect username or password.'] = 'Utilisteur ou mot de passe invalide'

export default amplifyTranslations

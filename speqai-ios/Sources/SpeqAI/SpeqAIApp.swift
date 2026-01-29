import SwiftUI

@main
struct SpeqAIApp: App {
    let persistenceManager = PersistenceManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(ChatViewModel())
        }
    }
}

// Persistence manager for app settings
class PersistenceManager {
    private let userDefaults = UserDefaults.standard
    
    func saveVoicePrompt(_ prompt: String) {
        userDefaults.set(prompt, forKey: "voicePrompt")
    }
    
    func getVoicePrompt() -> String {
        userDefaults.string(forKey: "voicePrompt") ?? "You are a helpful assistant."
    }
    
    func saveTextPrompt(_ prompt: String) {
        userDefaults.set(prompt, forKey: "textPrompt")
    }
    
    func getTextPrompt() -> String {
        userDefaults.string(forKey: "textPrompt") ?? "You are a helpful assistant."
    }
    
    func saveTemperature(_ temperature: Double) {
        userDefaults.set(temperature, forKey: "temperature")
    }
    
    func getTemperature() -> Double {
        userDefaults.double(forKey: "temperature")
    }
    
    func clearAll() {
        userDefaults.removeObject(forKey: "voicePrompt")
        userDefaults.removeObject(forKey: "textPrompt")
        userDefaults.removeObject(forKey: "temperature")
    }
}

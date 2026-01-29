import UIKit
import SwiftUI

// AppDelegate for iOS 15+
@main
struct SpeqAIDelegate: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(ChatViewModel())
        }
    }
}

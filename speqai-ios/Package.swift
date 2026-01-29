// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "SpeqAI",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "SpeqAI",
            targets: ["SpeqAI"]
        )
    ],
    dependencies: [
        // swift-opus for Opus audio decoding
        .package(
            url: "https://github.com/Alta/swift-opus.git",
            from: "0.6.0"
        ),
        // AsyncHTTPClient for WebSocket
        .package(
            url: "https://github.com/swift-server/async-http-client.git",
            from: "1.0.0"
        ),
        // Logging
        .package(
            url: "https://github.com/nicklockwood/Logging.git",
            from: "4.0.0"
        )
    ],
    targets: [
        .target(
            name: "SpeqAI",
            dependencies: [
                "SwiftOpus",
                .product(name: "AsyncHTTPClient", package: "async-http-client"),
                .product(name: "Logging", package: "Logging")
            ],
            path: "Sources/SpeqAI"
        ),
        .testTarget(
            name: "SpeqAITests",
            dependencies: ["SpeqAI"],
            path: "Tests/SpeqAITests"
        )
    ]
)

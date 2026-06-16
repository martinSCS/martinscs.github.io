#!/usr/bin/env swift
import AppKit
import CoreText
import Foundation

let args = parseArgs(Array(CommandLine.arguments.dropFirst()))

if args["help"] != nil || args["text"] == nil || args["output"] == nil {
    printHelp()
    exit(args["help"] != nil ? 0 : 1)
}

let text = args["text"]!
let output = args["output"]!
let width = intArg(args["width"], fallback: 300)
let height = intArg(args["height"], fallback: 120)
let fontSize = doubleArg(args["font-size"], fallback: 72)
let googleCss = args["google-css"]
var fontFamily = args["font-family"]
let fontFile = args["font-file"]
let fillColor = colorArg(args["fill"]) ?? NSColor(red: 0.125, green: 0.129, blue: 0.141, alpha: 1)
let backgroundColor = colorArg(args["background"])
let letterSpacing = args["letter-spacing"].flatMap(Double.init)
let x = coordinateArg(args["x"], total: width, fallback: Double(width) / 2)
let y = coordinateArg(args["y"], total: height, fallback: Double(height) / 2)
let textAnchor = args["text-anchor"] ?? "middle"
let dominantBaseline = args["dominant-baseline"] ?? "central"

if let fontFile {
    try registerFont(file: fontFile)
}

if let googleCss {
    let googleFont = try registerGoogleFonts(cssUrl: googleCss)
    if fontFamily == nil {
        fontFamily = googleFont
    }
}

let font = makeFont(fontFamily: fontFamily, fontSize: fontSize)
let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: width,
    pixelsHigh: height,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
)!

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSGraphicsContext.current?.imageInterpolation = .high
NSGraphicsContext.current?.shouldAntialias = true
NSGraphicsContext.current?.cgContext.clear(CGRect(x: 0, y: 0, width: width, height: height))

if let backgroundColor {
    backgroundColor.setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
}

let paragraph = NSMutableParagraphStyle()
paragraph.alignment = .center

var attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: fillColor,
    .paragraphStyle: paragraph
]

if let letterSpacing {
    attributes[.kern] = letterSpacing
}

let attributedText = NSAttributedString(string: text, attributes: attributes)
let textSize = attributedText.boundingRect(
    with: NSSize(width: CGFloat(width), height: .greatestFiniteMagnitude),
    options: [.usesLineFragmentOrigin, .usesFontLeading]
).size

let drawX: CGFloat
switch textAnchor {
case "start":
    drawX = CGFloat(x)
case "end":
    drawX = CGFloat(x) - textSize.width
default:
    drawX = CGFloat(x) - textSize.width / 2
}

let drawY: CGFloat
switch dominantBaseline {
case "hanging", "top":
    drawY = CGFloat(y)
case "baseline":
    drawY = CGFloat(y) - textSize.height
default:
    drawY = CGFloat(y) - textSize.height / 2
}

attributedText.draw(in: NSRect(x: drawX, y: drawY, width: textSize.width.ceilUp(), height: textSize.height.ceilUp()))
NSGraphicsContext.restoreGraphicsState()

let data = rep.representation(using: .png, properties: [:])!
try FileManager.default.createDirectory(atPath: URL(fileURLWithPath: output).deletingLastPathComponent().path, withIntermediateDirectories: true)
try data.write(to: URL(fileURLWithPath: output))
print("Wrote \(output)")

func parseArgs(_ argv: [String]) -> [String: String] {
    var parsed: [String: String] = [:]
    var index = 0

    while index < argv.count {
        let arg = argv[index]
        guard arg.hasPrefix("--") else {
            index += 1
            continue
        }

        let key = String(arg.dropFirst(2))
        let nextIndex = index + 1
        if nextIndex < argv.count && !argv[nextIndex].hasPrefix("--") {
            parsed[key] = argv[nextIndex]
            index += 2
        } else {
            parsed[key] = "true"
            index += 1
        }
    }

    return parsed
}

func intArg(_ value: String?, fallback: Int) -> Int {
    guard let value else { return fallback }
    guard let number = Int(value), number > 0 else {
        fatalError("Invalid number: \(value)")
    }
    return number
}

func doubleArg(_ value: String?, fallback: Double) -> Double {
    guard let value else { return fallback }
    guard let number = Double(value), number > 0 else {
        fatalError("Invalid number: \(value)")
    }
    return number
}

func coordinateArg(_ value: String?, total: Int, fallback: Double) -> Double {
    guard let value else { return fallback }
    if value.hasSuffix("%"), let percentage = Double(value.dropLast()) {
        return Double(total) * percentage / 100
    }
    return Double(value) ?? fallback
}

func colorArg(_ value: String?) -> NSColor? {
    guard let value else { return nil }
    if ["none", "transparent", "clear"].contains(value.lowercased()) {
        return nil
    }

    let hex = value.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    let scanner = Scanner(string: hex)
    var rgb: UInt64 = 0
    guard scanner.scanHexInt64(&rgb) else { return nil }

    if hex.count == 6 {
        return NSColor(
            red: CGFloat((rgb & 0xff0000) >> 16) / 255,
            green: CGFloat((rgb & 0x00ff00) >> 8) / 255,
            blue: CGFloat(rgb & 0x0000ff) / 255,
            alpha: 1
        )
    }

    if hex.count == 3 {
        let red = CGFloat((rgb & 0xf00) >> 8) / 15
        let green = CGFloat((rgb & 0x0f0) >> 4) / 15
        let blue = CGFloat(rgb & 0x00f) / 15
        return NSColor(red: red, green: green, blue: blue, alpha: 1)
    }

    return nil
}

func registerFont(file: String) throws {
    let url = URL(fileURLWithPath: file)
    var error: Unmanaged<CFError>?
    CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
}

func registerGoogleFonts(cssUrl: String) throws -> String? {
    guard let url = URL(string: cssUrl) else {
        fatalError("Invalid Google Fonts CSS URL: \(cssUrl)")
    }

    let css = try String(contentsOf: url, encoding: .utf8)
    let family = firstMatch(in: css, pattern: #"font-family:\s*['"]?([^;'"]+)['"]?;"#)
    let fontUrls = uniqueMatches(in: css, pattern: #"url\((https://fonts\.gstatic\.com/[^)]+)\)"#)

    if fontUrls.isEmpty {
        fatalError("No Google Fonts files found in CSS: \(cssUrl)")
    }

    for fontUrlString in fontUrls {
        try registerRemoteFont(urlString: fontUrlString)
    }

    return family
}

func registerRemoteFont(urlString: String) throws {
    guard let url = URL(string: urlString) else {
        fatalError("Invalid font URL: \(urlString)")
    }

    let data = try Data(contentsOf: url)
    let fileExtension = url.pathExtension.isEmpty ? "woff2" : url.pathExtension
    let temporaryURL = FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString)
        .appendingPathExtension(fileExtension)
    try data.write(to: temporaryURL)

    var error: Unmanaged<CFError>?
    CTFontManagerRegisterFontsForURL(temporaryURL as CFURL, .process, &error)
}

func firstMatch(in value: String, pattern: String) -> String? {
    guard let regex = try? NSRegularExpression(pattern: pattern) else {
        return nil
    }

    let range = NSRange(value.startIndex..<value.endIndex, in: value)
    guard let match = regex.firstMatch(in: value, range: range),
          match.numberOfRanges > 1,
          let matchRange = Range(match.range(at: 1), in: value) else {
        return nil
    }

    return String(value[matchRange])
}

func uniqueMatches(in value: String, pattern: String) -> [String] {
    guard let regex = try? NSRegularExpression(pattern: pattern) else {
        return []
    }

    let range = NSRange(value.startIndex..<value.endIndex, in: value)
    var seen = Set<String>()
    var matches: [String] = []

    regex.enumerateMatches(in: value, range: range) { match, _, _ in
        guard let match,
              match.numberOfRanges > 1,
              let matchRange = Range(match.range(at: 1), in: value) else {
            return
        }

        let matchValue = String(value[matchRange])
        if !seen.contains(matchValue) {
            seen.insert(matchValue)
            matches.append(matchValue)
        }
    }

    return matches
}

func makeFont(fontFamily: String?, fontSize: Double) -> NSFont {
    if let fontFamily, let font = NSFont(name: fontFamily, size: fontSize) {
        return font
    }

    if let fontFamily {
        let descriptor = NSFontDescriptor(fontAttributes: [.family: fontFamily])
        if let font = NSFont(descriptor: descriptor, size: fontSize) {
            return font
        }
    }

    return NSFont.systemFont(ofSize: fontSize, weight: .semibold)
}

extension CGFloat {
    func ceilUp() -> CGFloat {
        Darwin.ceil(self)
    }
}

func printHelp() {
    print("""
Usage:
  swift games/daily-quiz/tools/generate-text-png.swift --text "Nhật Bản" --output games/daily-quiz/quizzes/2026/06/2026-06-19-image.png

Options:
  --text <text>                 Text to render. Required.
  --output <path>               PNG output path. Required.
  --width <number>              PNG width. Default: 300.
  --height <number>             PNG height. Default: 120.
  --font-size <number>          Font size in px. Default: 72.
  --font-family <value>         Installed font name/family, font file name, or Google Fonts family.
  --font-file <path>            Register a local .ttf/.otf/.ttc/.otc font before rendering.
  --google-css <url>            Download and register font files from a Google Fonts CSS URL.
  --fill <color>                Text color. Default: #202124.
  --background <color>          Optional background color. Default: transparent.
  --x <value>                   Text x coordinate. Supports px or %. Default: 50%.
  --y <value>                   Text y coordinate. Supports px or %. Default: 50%.
  --text-anchor <value>         start, middle, end. Default: middle.
  --dominant-baseline <value>   central, top/hanging, baseline. Default: central.
  --letter-spacing <number>     Optional letter spacing in px.
""")
}

import AVFoundation
import CoreLocation
import UIKit

/// Keeps MASA IA resident when the phone leaves the app.
///
/// iOS suspends a WebView app the moment it backgrounds. Two anchors hold the
/// process open instead: a silent audio session (UIBackgroundModes `audio`) and
/// background location (UIBackgroundModes `location`). Either one alone keeps
/// the app alive; both together survive one of them being revoked.
final class KeepAlive: NSObject {
    static let shared = KeepAlive()

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let locations = CLLocationManager()
    private var silence: AVAudioPCMBuffer?

    func start() {
        startSilentAudio()
        startLocationAnchor()

        let center = NotificationCenter.default
        center.addObserver(self,
                           selector: #selector(handleInterruption(_:)),
                           name: AVAudioSession.interruptionNotification,
                           object: nil)
        center.addObserver(self,
                           selector: #selector(restartAudio),
                           name: AVAudioSession.mediaServicesWereResetNotification,
                           object: nil)
        center.addObserver(self,
                           selector: #selector(restartAudio),
                           name: UIApplication.didEnterBackgroundNotification,
                           object: nil)
    }

    // MARK: - Silent audio

    private func startSilentAudio() {
        let session = AVAudioSession.sharedInstance()
        do {
            // .mixWithOthers so the globe never stops the operator's own music.
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            NSLog("[KeepAlive] audio session failed: \(error.localizedDescription)")
            return
        }

        let format = engine.outputNode.inputFormat(forBus: 0)
        guard format.sampleRate > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: format,
                                            frameCapacity: AVAudioFrameCount(format.sampleRate)) else {
            NSLog("[KeepAlive] no usable output format")
            return
        }
        // Zeroed frames: audible silence, still counts as playback to iOS.
        buffer.frameLength = buffer.frameCapacity
        silence = buffer

        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: format)
        engine.mainMixerNode.outputVolume = 0

        restartAudio()
    }

    @objc private func restartAudio() {
        guard let silence else { return }
        do {
            try AVAudioSession.sharedInstance().setActive(true)
            if !engine.isRunning {
                engine.prepare()
                try engine.start()
            }
            player.scheduleBuffer(silence, at: nil, options: .loops)
            if !player.isPlaying {
                player.play()
            }
        } catch {
            NSLog("[KeepAlive] audio restart failed: \(error.localizedDescription)")
        }
    }

    @objc private func handleInterruption(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
        // A phone call or Siri ends the session; claim it back the moment they let go.
        if type == .ended {
            restartAudio()
        }
    }

    // MARK: - Location anchor

    private func startLocationAnchor() {
        locations.delegate = self
        locations.desiredAccuracy = kCLLocationAccuracyKilometer
        locations.distanceFilter = 500
        locations.pausesLocationUpdatesAutomatically = false
        locations.requestAlwaysAuthorization()
        applyLocationAuthorization(locations.authorizationStatus)
    }

    private func applyLocationAuthorization(_ status: CLAuthorizationStatus) {
        guard status == .authorizedAlways else { return }
        locations.allowsBackgroundLocationUpdates = true
        locations.startUpdatingLocation()
        // Survives a jetsam kill: iOS relaunches the app on a significant move.
        locations.startMonitoringSignificantLocationChanges()
    }
}

extension KeepAlive: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        applyLocationAuthorization(manager.authorizationStatus)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        // The web layer owns the globe; this anchor exists only to hold the process.
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        NSLog("[KeepAlive] location failed: \(error.localizedDescription)")
    }
}

import Foundation
import Capacitor
import RoomPlan
import UIKit

@objc(PinnedScanPlugin)
public class PinnedScanPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PinnedScanPlugin"
    public let jsName = "PinnedScan"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startScan", returnType: CAPPluginReturnPromise),
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 16.0, *) {
            call.resolve(["available": RoomCaptureSession.isSupported])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func startScan(_ call: CAPPluginCall) {
        if #available(iOS 16.0, *) {
            guard RoomCaptureSession.isSupported else {
                call.reject("LiDAR scanning is not supported on this device.")
                return
            }

            DispatchQueue.main.async {
                guard let viewController = self.bridge?.viewController else {
                    call.reject("Unable to present scan UI.")
                    return
                }

                let host = RoomScanHostController()
                host.configure(
                    onComplete: { payload in
                        call.resolve(payload)
                    },
                    onCancel: {
                        call.reject("Scan cancelled.")
                    }
                )

                let nav = UINavigationController(rootViewController: host)
                nav.modalPresentationStyle = .fullScreen
                viewController.present(nav, animated: true)
            }
        } else {
            call.reject("RoomPlan requires iOS 16 or later.")
        }
    }
}

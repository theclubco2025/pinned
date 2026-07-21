import UIKit
import RoomPlan

@available(iOS 16.0, *)
final class RoomScanHostController: UIViewController, RoomCaptureViewDelegate, RoomCaptureSessionDelegate {
    private var captureView: RoomCaptureView!
    private var onComplete: (([String: Any]) -> Void)?
    private var onCancel: (() -> Void)?

    func configure(
        onComplete: @escaping ([String: Any]) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.onComplete = onComplete
        self.onCancel = onCancel
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Scan your store"
        view.backgroundColor = .black

        captureView = RoomCaptureView(frame: view.bounds)
        captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        captureView.captureSession.delegate = self
        captureView.delegate = self
        view.addSubview(captureView)

        navigationItem.leftBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .cancel,
            target: self,
            action: #selector(cancelTapped)
        )
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            title: "Done",
            style: .done,
            target: self,
            action: #selector(doneTapped)
        )
    }

    @objc private func cancelTapped() {
        captureView.captureSession.stop()
        onCancel?()
        dismiss(animated: true)
    }

    @objc private func doneTapped() {
        captureView.captureSession.stop()
    }

    func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
        if let error = error {
            onCancel?()
            dismiss(animated: true) {
                print("RoomPlan error: \(error.localizedDescription)")
            }
            return
        }
        let payload = RoomScanConverter.toDictionary(processedResult)
        dismiss(animated: true) { [weak self] in
            self?.onComplete?(payload)
        }
    }
}

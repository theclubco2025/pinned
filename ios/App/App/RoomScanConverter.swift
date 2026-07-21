import Foundation
import RoomPlan
import simd

@available(iOS 16.0, *)
enum RoomScanConverter {
    static func toDictionary(_ room: CapturedRoom) -> [String: Any] {
        var minX = Double.greatestFiniteMagnitude
        var minY = Double.greatestFiniteMagnitude
        var maxX = -Double.greatestFiniteMagnitude
        var maxY = -Double.greatestFiniteMagnitude

        func includePoint(_ x: Double, _ y: Double) {
            minX = min(minX, x)
            minY = min(minY, y)
            maxX = max(maxX, x)
            maxY = max(maxY, y)
        }

        func floorPoint(from transform: simd_float4x4) -> (x: Double, y: Double) {
            let x = Double(transform.columns.3.x)
            let y = Double(transform.columns.3.z)
            includePoint(x, y)
            return (x, y)
        }

        var walls: [[String: Any]] = []
        for wall in room.walls {
            let center = floorPoint(from: wall.transform)
            let width = Double(wall.dimensions.x)
            let depth = Double(wall.dimensions.z)
            let halfW = width / 2
            walls.append([
                "start": ["x": center.x - halfW, "y": center.y],
                "end": ["x": center.x + halfW, "y": center.y],
                "height": Double(wall.dimensions.y),
            ])
        }

        var objects: [[String: Any]] = []
        for (index, object) in room.objects.enumerated() {
            let center = floorPoint(from: object.transform)
            objects.append([
                "id": "obj-\(index)",
                "category": categoryString(object.category),
                "center": ["x": center.x, "y": center.y],
                "size": [
                    "w": max(0.4, Double(object.dimensions.x)),
                    "d": max(0.4, Double(object.dimensions.z)),
                ],
                "rotation": Double(rotationY(from: object.transform)),
            ])
        }

        var doors: [[String: Any]] = []
        for door in room.doors {
            let center = floorPoint(from: door.transform)
            doors.append([
                "center": ["x": center.x, "y": center.y],
                "width": max(0.6, Double(door.dimensions.x)),
            ])
        }

        let width = max(1.0, maxX - minX)
        let depth = max(1.0, maxY - minY)

        func normalizeX(_ x: Double) -> Double { x - minX }
        func normalizeY(_ y: Double) -> Double { y - minY }

        let normalizedWalls = walls.map { wall -> [String: Any] in
            let start = wall["start"] as! [String: Double]
            let end = wall["end"] as! [String: Double]
            return [
                "start": ["x": normalizeX(start["x"]!), "y": normalizeY(start["y"]!)],
                "end": ["x": normalizeX(end["x"]!), "y": normalizeY(end["y"]!)],
                "height": wall["height"] as Any,
            ]
        }

        let normalizedObjects = objects.map { obj -> [String: Any] in
            var copy = obj
            let center = obj["center"] as! [String: Double]
            copy["center"] = ["x": normalizeX(center["x"]!), "y": normalizeY(center["y"]!)]
            return copy
        }

        let normalizedDoors = doors.map { door -> [String: Any] in
            let center = door["center"] as! [String: Double]
            return [
                "center": ["x": normalizeX(center["x"]!), "y": normalizeY(center["y"]!)],
                "width": door["width"] as Any,
            ]
        }

        let iso = ISO8601DateFormatter().string(from: Date())

        return [
            "source": "roomplan",
            "unit": "m",
            "bounds": ["width": width, "depth": depth],
            "walls": normalizedWalls,
            "objects": normalizedObjects,
            "doors": normalizedDoors,
            "capturedAt": iso,
        ]
    }

    private static func categoryString(_ category: CapturedRoom.Object.Category) -> String {
        switch category {
        case .storage: return "storage"
        case .refrigerator: return "refrigerator"
        case .stove: return "oven"
        case .table: return "table"
        case .sofa: return "sofa"
        case .bed: return "bed"
        case .sink: return "sink"
        case .washerDryer: return "storage"
        case .toilet: return "storage"
        case .bathtub: return "storage"
        case .television: return "table"
        case .fireplace: return "table"
        case .stairs: return "storage"
        @unknown default: return "shelf"
        }
    }

    private static func rotationY(from transform: simd_float4x4) -> Double {
        Double(atan2(transform.columns.0.z, transform.columns.0.x))
    }
}

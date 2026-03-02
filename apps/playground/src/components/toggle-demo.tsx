import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface ToggleDemoProps {
  value: boolean;
  onToggle: () => void;
  onSetOn: () => void;
  onSetOff: () => void;
}

export function ToggleDemo({
  value,
  onToggle,
  onSetOn,
  onSetOff,
}: ToggleDemoProps) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
          useToggle
        </CardTitle>
        <CardDescription className="text-base text-gray-500 mt-1">
          Simple state toggle management
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* State Display */}
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-xl font-medium text-gray-900">
              {value ? "On" : "Off"}
            </p>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold transition-all duration-200 ${
              value ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {value ? "ON" : "OFF"}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={onToggle}
            className="h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm transition-all"
          >
            Toggle
          </Button>
          <Button
            onClick={onSetOn}
            variant="secondary"
            className="h-11 bg-white hover:bg-gray-50 text-gray-900 font-medium border border-gray-300 shadow-sm transition-all"
          >
            On
          </Button>
          <Button
            onClick={onSetOff}
            variant="outline"
            className="h-11 hover:bg-gray-50 text-gray-900 font-medium border border-gray-300 shadow-sm transition-all"
          >
            Off
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

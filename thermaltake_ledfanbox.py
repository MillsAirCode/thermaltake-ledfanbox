#!/usr/bin/env python3
"""
Thermaltake LEDFanBox Controller
Controls fan speed and RGB lighting for Thermaltake LEDFanBox

Copyright 2026 Brad (@BikeGuy07)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import hid
import time
import argparse
import sys
from colorsys import hsv_to_rgb

# Device info
DEVICE_VENDOR_ID = 0x264a
DEVICE_PRODUCT_ID = 0x232b

def find_device():
    """Find and open the Thermaltake LEDFanBox device"""
    devices = hid.enumerate()
    for dev in devices:
        if dev['vendor_id'] == DEVICE_VENDOR_ID and dev['product_id'] == DEVICE_PRODUCT_ID:
            device = hid.device()
            device.open_path(dev['path'])
            return device
    return None

def set_fan_speed(device, speed_percent):
    """Set fan speed (0-100%)"""
    if speed_percent < 0 or speed_percent > 100:
        print(f"Error: Speed must be between 0 and 100")
        return False

    # Formula: 01 [speed * 0x19]
    # Uses modulo 256 to keep value within byte range
    command = bytes([0x01, (speed_percent * 0x19) % 256])
    bytes_written = device.write(command)
    if bytes_written > 0:
        print(f"✓ Fan speed set to {speed_percent}%")
        return True
    else:
        print(f"✗ Failed to set fan speed")
        return False

def set_rgb_color(device, r, g, b):
    """Set RGB color (0-255 each)"""
    if not (0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255):
        print(f"Error: RGB values must be between 0 and 255")
        return False

    command = bytes([r, g, b])
    bytes_written = device.write(command)
    if bytes_written > 0:
        print(f"✓ RGB set to ({r}, {g}, {b})")
        return True
    else:
        print(f"✗ Failed to set RGB")
        return False

def set_mode(device, mode):
    """Set lighting mode: 0=Off, 1=Static, 2=Breathing, 3=Rainbow"""
    modes = {
        'off': 0,
        'static': 1,
        'breathing': 2,
        'rainbow': 3
    }

    if mode not in modes:
        print(f"Error: Unknown mode. Use: {', '.join(modes.keys())}")
        return False

    command = bytes([modes[mode]])
    bytes_written = device.write(command)
    if bytes_written > 0:
        print(f"✓ Mode set to {mode}")
        return True
    else:
        print(f"✗ Failed to set mode")
        return False

def get_color_from_name(color_name):
    """Get RGB values from color name"""
    colors = {
        'red': (255, 0, 0),
        'green': (0, 255, 0),
        'blue': (0, 0, 255),
        'yellow': (255, 255, 0),
        'magenta': (255, 0, 255),
        'cyan': (0, 255, 255),
        'white': (255, 255, 255),
        'orange': (255, 165, 0),
        'purple': (128, 0, 128),
        'pink': (255, 192, 203),
    }

    return colors.get(color_name.lower())

def hsv_to_hex(h, s, v):
    """Convert HSV to hex RGB"""
    r, g, b = [int(c * 255) for c in hsv_to_rgb(h, s, v)]
    return r, g, b

def main():
    parser = argparse.ArgumentParser(
        description='Thermaltake LEDFanBox Controller',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --speed 50           # Set fan to 50%
  %(prog)s --rgb red            # Set RGB to red
  %(prog)s --rgb 255 0 0        # Set RGB to red (hex)
  %(prog)s --mode rainbow       # Set rainbow mode
  %(prog)s --speed 75 --rgb blue --mode static
  %(prog)s --cycle-colors       # Cycle through colors
        """
    )

    parser.add_argument('--speed', type=int, choices=range(0, 101),
                        help='Set fan speed (0-100%)')
    parser.add_argument('--rgb', nargs='+', type=int, metavar='R G B',
                        help='Set RGB color (0-255 each) or color name')
    parser.add_argument('--mode', choices=['off', 'static', 'breathing', 'rainbow'],
                        help='Set lighting mode')
    parser.add_argument('--cycle-colors', action='store_true',
                        help='Cycle through rainbow colors')

    args = parser.parse_args()

    # Find and open device
    device = find_device()
    if not device:
        print("Error: Could not find Thermaltake LEDFanBox")
        print("Make sure the device is connected and permissions are set")
        sys.exit(1)

    try:
        # Handle RGB from name
        if args.rgb:
            if len(args.rgb) == 1:
                # Single argument might be a color name
                color = get_color_from_name(args.rgb[0])
                if color:
                    args.rgb = color
                else:
                    print(f"Error: Unknown color '{args.rgb[0]}'")
                    sys.exit(1)
            
            if len(args.rgb) == 3:
                r, g, b = args.rgb
                set_rgb_color(device, r, g, b)
            else:
                print("Error: RGB requires 1-3 values (color name or R G B)")
                sys.exit(1)

        # Handle mode
        if args.mode:
            set_mode(device, args.mode)

        # Handle speed
        if args.speed is not None:
            set_fan_speed(device, args.speed)

        # Handle color cycling
        if args.cycle_colors:
            print("Cycling colors... (Ctrl+C to stop)")
            colors = [
                (255, 0, 0),    # Red
                (0, 255, 0),    # Green
                (0, 0, 255),    # Blue
                (255, 255, 0),  # Yellow
                (255, 0, 255),  # Magenta
                (0, 255, 255),  # Cyan
                (255, 255, 255), # White
                (255, 165, 0),  # Orange
                (128, 0, 128),  # Purple
            ]
            for r, g, b in colors:
                set_rgb_color(device, r, g, b)
                time.sleep(0.5)

        print("\n✓ All commands executed successfully")

    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        device.close()
        print("\nDevice closed")

if __name__ == '__main__':
    main()

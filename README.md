# Thermaltake LEDFanBox Controller

A Python tool to control fan speed and RGB lighting on Thermaltake LEDFanBox devices.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.12+-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux-lightgrey.svg)

## Overview

This project provides a command-line interface to control the Thermaltake LEDFanBox (model: FANBOX01), allowing you to:
- Adjust fan speed (0-100%)
- Set RGB lighting colors
- Control lighting modes (Off, Static, Breathing, Rainbow)
- Cycle through colors automatically

## Features

- ✅ Fan speed control with precision (0-100%)
- ✅ RGB color control with hex values or color names
- ✅ Multiple lighting modes
- ✅ Color cycling mode
- ✅ Python-based HIDAPI implementation
- ✅ Cross-platform compatible (Linux, macOS, Windows)
- ✅ Simple command-line interface
- ✅ Comprehensive documentation

## Installation

### Prerequisites

- Python 3.12 or higher
- `hidapi` Python library

### Ubuntu/Debian

```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip python3-dev

# Install hidapi
pip3 install --break-system-packages hidapi

# Make script executable
chmod +x thermaltake_ledfanbox.py
```

### macOS

```bash
# Install dependencies
brew install hidapi

# Install hidapi Python library
pip3 install hidapi

# Make script executable
chmod +x thermaltake_ledfanbox.py
```

### Windows

```powershell
# Install dependencies
pip install hidapi

# Run directly (no chmod needed)
python thermaltake_ledfanbox.py
```

## Usage

### Basic Commands

```bash
# Set fan speed to 50%
python3 thermaltake_ledfanbox.py --speed 50

# Set RGB to blue
python3 thermaltake_ledfanbox.py --rgb blue

# Set RGB to red (hex values)
python3 thermaltake_ledfanbox.py --rgb 255 0 0

# Set rainbow mode
python3 thermaltake_ledfanbox.py --mode rainbow

# Set fan to 75%, RGB to cyan, mode to static
python3 thermaltake_ledfanbox.py --speed 75 --rgb cyan --mode static
```

### Color Names

| Color | Command |
|-------|---------|
| red | `--rgb red` |
| green | `--rgb green` |
| blue | `--rgb blue` |
| yellow | `--rgb yellow` |
| magenta | `--rgb magenta` |
| cyan | `--rgb cyan` |
| white | `--rgb white` |
| orange | `--rgb orange` |
| purple | `--rgb purple` |
| pink | `--rgb pink` |

### Advanced Usage

```bash
# Cycle through all colors continuously
python3 thermaltake_ledfanbox.py --cycle-colors

# Multiple arguments at once
python3 thermaltake_ledfanbox.py --speed 80 --rgb 255 0 128 --mode breathing

# Turn everything off
python3 thermaltake_ledfanbox.py --speed 0 --mode off
```

### Help

```bash
python3 thermaltake_ledfanbox.py --help
```

## Device Communication

The controller uses HID (Human Interface Device) protocol:

- **Vendor ID:** `0x264a`
- **Product ID:** `0x232b`
- **Communication:** One-way (device accepts commands but doesn't respond)

### Command Formats

**Fan Speed (2 bytes):**
```
01 [speed * 0x19]
```
Where `speed` is an integer between 0 and 100.

**RGB Color (3 bytes):**
```
[R][G][B]
```
Where each channel is a hex value between 0 and 255.

**Mode (1 byte):**
```
00 = Off
01 = Static
02 = Breathing
03 = Rainbow
```

## Troubleshooting

### Device Not Found

```bash
# Check if device is detected
lsusb | grep 264a

# Check HID devices
python3 -c "import hid; devices = hid.enumerate(); print([d for d in devices if d['vendor_id'] == 0x264a])"
```

### Permission Denied (Linux)

Create a udev rule:

```bash
sudo nano /etc/udev/rules.d/99-thermaltake.rules
```

Add:
```
SUBSYSTEM=="usb", ATTR{idVendor}=="264a", ATTR{idProduct}=="232b", MODE="0666"
```

Reload udev:
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Device Not Responding

1. Make sure the device is properly connected
2. Try re-plugging the device
3. Check if other applications are using the device
4. Verify HIDAPI is working:
   ```bash
   python3 -c "import hid; print(hid.enumerate())"
   ```

## Systemd Service (Linux)

To run the controller as a background service:

1. Create systemd service file:
   ```bash
   sudo nano /etc/systemd/system/thermaltake-ledfanbox.service
   ```

2. Add the following configuration:
   ```ini
   [Unit]
   Description=Thermaltake LEDFanBox Controller
   After=network.target

   [Service]
   Type=simple
   User=YOUR_USERNAME
   ExecStart=/usr/bin/python3 /path/to/thermaltake_ledfanbox.py --speed 50 --rgb blue --mode static
   Restart=on-failure
   RestartSec=5
   StandardOutput=syslog
   StandardError=syslog
   SyslogIdentifier=thermaltake-ledfanbox

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable thermaltake-ledfanbox
   sudo systemctl start thermaltake-ledfanbox
   ```

4. Check status:
   ```bash
   sudo systemctl status thermaltake-ledfanbox
   ```

## Project Structure

```
.
├── LICENSE                 # Apache 2.0 License
├── README.md              # This file
├── README-THERMALTAKE.md  # Detailed documentation
├── thermaltake_ledfanbox.py    # Main script
└── thermaltake-ledfanbox.service  # Systemd service template
```

## Development

### Code Overview

The main script (`thermaltake_ledfanbox.py`) includes:

- `find_device()`: Detects and opens the HID device
- `set_fan_speed()`: Configures fan speed (0-100%)
- `set_rgb_color()`: Sets RGB lighting values
- `set_mode()`: Controls lighting mode
- `get_color_from_name()`: Maps color names to RGB values
- `hsv_to_hex()`: Converts HSV to RGB hex values
- `main()`: Command-line argument parsing and execution

### Key Features

- **Error Handling**: Comprehensive try-catch blocks and user-friendly error messages
- **Argument Parsing**: Flexible command-line interface
- **Color Support**: Hex values and named colors
- **Device Management**: Automatic device discovery and connection
- **Cross-Platform**: Works on Linux, macOS, and Windows

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Credits

- **Original Firmware Reverse Engineering**: Brad (@BikeGuy07)
- **Python HIDAPI Implementation**: Python HIDAPI contributors
- **Inspiration**: linux_thermaltake_riing project

## Acknowledgments

- Thermaltake for creating this innovative cooling solution
- The open-source community for HIDAPI support
- All contributors and users who provide feedback and suggestions

## Support

- Open an issue on GitHub for bugs or feature requests
- Check the [Troubleshooting](#troubleshooting) section first
- Review the [README-THERMALTAKE.md](README-THERMALTAKE.md) for detailed documentation

## Changelog

### Version 1.0.0
- Initial release
- Fan speed control (0-100%)
- RGB color control
- Lighting modes (Off, Static, Breathing, Rainbow)
- Color cycling
- Comprehensive documentation

---

**Made with ❤️ for the thermaltake community**

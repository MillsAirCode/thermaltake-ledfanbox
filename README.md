# Thermaltake LEDFanBox Controller for Linux

A Python tool to control fan speed and RGB lighting on Thermaltake LEDFanBox devices.

## Features

- Set fan speed (0-100%)
- Set RGB color (0-255 per channel)
- Set lighting mode (Off, Static, Breathing, Rainbow)
- Color name shortcuts (red, green, blue, etc.)
- Color cycling mode

## Requirements

- Ubuntu Linux (tested on Ubuntu 24.04)
- Python 3.12
- hidapi library

## Installation

1. **Clone or download** the `thermaltake_ledfanbox.py` script

2. **Make it executable:**
```bash
chmod +x thermaltake_ledfanbox.py
```

3. **Install dependencies (if not already installed):**
```bash
pip3 install --break-system-packages hidapi
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

- red, green, blue, yellow, magenta, cyan, white, orange, purple, pink

### Cycling Colors

```bash
# Cycle through all colors continuously
python3 thermaltake_ledfanbox.py --cycle-colors
```

Press `Ctrl+C` to stop.

### Help

```bash
python3 thermaltake_ledfanbox.py --help
```

## Device Communication

The controller uses HID (Human Interface Device) protocol:
- Vendor ID: 0x264a
- Product ID: 0x232b
- Communication: One-way (device accepts commands but doesn't respond)

### Command Formats

**Fan Speed (2 bytes):**
- `01 [speed * 0x19]` where speed is 0-100

**RGB Color (3 bytes):**
- `[R][G][B]` where each is hex 0-255

**Mode (1-3 bytes):**
- `00` = Off
- `01` = Static
- `02` = Breathing
- `03` = Rainbow

## Troubleshooting

### Device not found

```bash
# Check if device is detected
lsusb | grep 264a

# Check HID devices
python3 -c "import hid; devices = hid.enumerate(); print([d for d in devices if d['vendor_id'] == 0x264a])"
```

### Permission denied

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

### Device not responding

- Make sure the device is properly connected
- Try re-plugging the device
- Check if other applications are using the device

## Development

### Creating a Systemd Service

Create `/etc/systemd/system/thermaltake-ledfanbox.service`:
```ini
[Unit]
Description=Thermaltake LEDFanBox Controller
After=network.target

[Service]
Type=simple
User=flash
ExecStart=/usr/bin/python3 /home/flash/thermaltake_ledfanbox.py --speed 50 --rgb blue --mode static
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable thermaltake-ledfanbox
sudo systemctl start thermaltake-ledfanbox
```

## License

This project is provided as-is for educational purposes.

## Credits

- Original firmware reverse engineering by Brad (@BikeGuy07)
- Python HIDAPI implementation by various contributors
- Inspired by linux_thermaltake_riing project

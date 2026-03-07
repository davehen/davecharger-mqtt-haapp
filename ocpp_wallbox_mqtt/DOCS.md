<img width="128" height="128" alt="image" src="https://github.com/user-attachments/assets/2ee05e17-5e18-44da-8bfc-cb902f76ccfc" />
<b>OCPP Wallbox MQTT Server (Home Assistant Add-on)</b>

## ⚙️ Configuration

All options are configured in the add-on UI.

---

### 🔌 Wallbox settings

#### `wallbox_set_limit_unit`
Power unit used to control the wallbox.

Allowed values:
- `W` = Watts (required for Huawei SmartCharger)  
- `A` = Amps

---

#### `wallbox_set_limit_mainstep`
Step used when converting Watt power changes into real Ampere increments.

This parameter defines how many Amps are added or removed at each adjustment when controlling the wallbox in Watts mode.

It replaces the old internal compensation logic (removed since v1.9910) to avoid cumulative errors and drifting values.

Default:
- `1` (1 Amp step)

Typical usage:
- Keep `1` for precise control  
- Increase slightly if your wallbox reacts too slowly to power changes  

---

#### `wallbox_set_limit_finestep`
Decimal precision supported by the wallbox when setting current limits.

This allows the server to send Ampere values with decimal digits instead of rounding to integers.

Example values:
- `0.01` → wallbox supports two decimal places (recommended for Huawei SmartCharger)  
- `0.1` → one decimal place  
- `1` → integer Amps only  


---

> ℹ️ When using `W` mode, the server adjusts power by translating Watt changes into real Ampere steps using `WALLBOX_SET_LIMIT_MAINSTEP`, then applies decimal precision defined by `WALLBOX_SET_LIMIT_FINESTEP`.

---


#### `ocpp_verbose`
Log verbosity of the OCPP server.

Range:
- `0` = minimal logs  
- `15` = full debug

---

#### `wallbox_mqtt_name`
MQTT topic prefix for the wallbox.

Example: MyWallbox

---

### 📡 MQTT connection

#### `mqtt_broker`
MQTT broker address.

Example: localhost:1883


#### `mqtt_user`
MQTT username (optional)

#### `mqtt_pass`
MQTT password (optional)

---

### ⚡ Grid power management

#### `GRID_LIMIT`
Maximum grid contract power in Watts.

Typical values:  4000 for 3kw contract

---

#### `GRID_LIMIT_SAFE`
Safety threshold below grid limit to avoid power disconnection.

Example:
GRID_LIMIT = 4000
GRID_LIMIT_SAFE = 3300


---

#### `ADD_WALLBOX_POWER_TO_METER`
If enabled, wallbox power is added to the home meter consumption.

Useful when the meter measures only household loads.

---

### 🔋 Charging control

#### `MINPOWER`
Minimum wallbox charging power.

Recommended:
- `6` when using Watts

---

#### `STOP_ON_SUSPENDEV`
Seconds to wait before stopping the charge when the EV enters suspended state.

This avoids idle energy waste (some EVs like Tesla may draw ~200W while suspended).

Example:

0 → disabled
0:30 → stop after 30 seconds
0:60 → stop after 1 minute


---

### 📊 MQTT Meter integration (optional)

If you have a power meter publishing data via MQTT, you can link it here.

#### `METER_MQTT_PREFIX`
Base MQTT topic for meter values.

Example: `home/grid`

---

#### `METER_MQTT_POWER`
Sub-topic for total grid power (appended to `METER_MQTT_PREFIX`).

Example: `power` → full topic: `home/grid/power`

---

#### Voltage topics

METER_MQTT_L1_VOLTAGE
METER_MQTT_L2_VOLTAGE
METER_MQTT_L3_VOLTAGE


---

#### Current topics

METER_MQTT_L1_CURRENT
METER_MQTT_L2_CURRENT
METER_MQTT_L3_CURRENT


---

#### `PV_MQTT_PREFIX`
Base MQTT topic for PV inverter power. Used by the charts to display solar production.

Example: `home/pv` → the add-on reads `home/pv/power`

---

### 🔄 Auto update

#### `auto_update`
Automatically pull the latest OCPP MQTT Perl Server code from Git at every startup.

When enabled, the add-on will check for updates and perform a git pull each time it starts.

⚠️ This updates the server engine, not the Home Assistant add-on itself.

---

### 🔄 Single update now

#### `single_update_now`
Perform a one-time update of the OCPP MQTT Perl Server at the next add-on startup.

When enabled, the add-on will execute a git pull once and then automatically reset this option to false.

⚠️ This updates the server engine, not the Home Assistant add-on itself.

---

### 📁 Data directory

#### `data_dir`
Subdirectory (relative to the add-on working directory) where the OCPP server stores its data files, such as energy history and charging session records.

These files are also served by the built-in web interface to display charts and history.

Default: `data`

⚠️ Leave this set to `data` for the charts to work correctly.

---



## 📌 Profiles

You need to check profile configuration inside ocpp.ini

---

## ⭐ Tips

After installing, go to /config/ocpp.ini and verify the configuration (the add-on write its settings here).

Configure the wallbox to connect to the OCPP server with:

Port: 9000

Encryption: none (no TLS)

Username/Password: none

---


## ⚙️ Automation

Home Assistant automation (example)

To provide the grid meter values and PV production (e.g., Huawei EMMA-A02) to the server via MQTT, create an automation like this:
```
alias: MQTT – EMMA meter completo
description: ""
triggers:
  - entity_id: sensor.emma_potenza_di_alimentazione_in_ingresso
    trigger: state
  - entity_id: sensor.emma_tensione_fase_a
    trigger: state
  - entity_id: sensor.emma_corrente_fase_a
    trigger: state
  - entity_id: sensor.emma_potenza_attiva_inverter
    trigger: state
actions:
  - choose:
      - conditions:
          - condition: template
            value_template: >-
              {{ trigger.entity_id ==
              'sensor.emma_potenza_di_alimentazione_in_ingresso' }}
        sequence:
          - action: mqtt.publish
            data:
              topic: home/grid/power
              payload: >-
                {{
                states('sensor.emma_potenza_di_alimentazione_in_ingresso')|float(0)
                }}
              retain: true
      - conditions:
          - condition: template
            value_template: "{{ trigger.entity_id == 'sensor.emma_tensione_fase_a' }}"
        sequence:
          - action: mqtt.publish
            data:
              topic: home/grid/l1_voltage
              payload: "{{ states('sensor.emma_tensione_fase_a')|float(0) }}"
              retain: true
      - conditions:
          - condition: template
            value_template: "{{ trigger.entity_id == 'sensor.emma_corrente_fase_a' }}"
        sequence:
          - action: mqtt.publish
            data:
              topic: home/grid/l1_current
              payload: "{{ states('sensor.emma_corrente_fase_a')|float(0) }}"
              retain: true
      - conditions:
          - condition: template
            value_template: "{{ trigger.entity_id == 'sensor.emma_potenza_attiva_inverter' }}"
        sequence:
          - action: mqtt.publish
            data:
              topic: home/pv/power
              payload: "{{ states('sensor.emma_potenza_attiva_inverter')|float(0) }}"
              retain: true
mode: queued
```
---
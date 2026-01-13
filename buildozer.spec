[app]

# (str) Title of your application
title = Futbol DT Palometas

# (str) Package name
package.name = futboldt

# (str) Package domain (needed for android/ios packaging)
package.domain = org.palometas

# (str) Source code where the main.py live
source.dir = .

# (list) Source files to include (let empty to include all the files)
source.include_exts = py,png,jpg,kv,atlas,db,txt,ttf

# (list) List of inclusions using pattern matching
#source.include_patterns = assets/*,images/*.png

# (list) Source files to exclude (let empty to include all the files)
source.exclude_exts = spec

# (list) List of directory to exclude (let empty to include all the files)
source.exclude_dirs = tests, venv, bin, .git

# (str) Application versioning (method 1)
version = 1.0

# (list) Application requirements
# comma separated e.g. requirements = sqlite3,kivy
requirements = python3,kivy==2.3.1,kivymd,sqlalchemy,pillow,pypdf,reportlab

# (str) Custom source folders for requirements
# (list) Permissions
android.permissions = INTERNET,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE

# (list) List of service to declare
#services = NAME:ENTRYPOINT_TO_PY,NAME2:ENTRYPOINT_TO_PY

# (str) Presplash of the application
presplash.filename = %(source.dir)s/logo.png

# (str) Icon of the application
icon.filename = %(source.dir)s/logo.png

# (str) Supported orientation (one of landscape, sensorLandscape, portrait or all)
orientation = landscape

# (bool) Indicate if the application should be fullscreen or not
fullscreen = 0

# (list) Android architectures to build for, choices: armeabi-v7a, arm64-v8a, x86, x86_64
android.archs = arm64-v8a, armeabi-v7a

# (int) Android API to use
android.api = 33

# (int) Minimum API your APK will support.
android.minapi = 21

# (str) Android NDK version to use
#android.ndk = 25b

# (bool) Use --private data storage (True) or --dir public storage (False)
#android.private_storage = True

# (str) Android entry point, default is to use start.py
#android.entrypoint = main.py

# (list) Pattern to whitelist for the search for entities in the apk
#android.whitelist = 

# (str) Bootstrap to use for android builds
#p4a.bootstrap = sdl2

# (int) port number to access your application (for some bootstraps)
#p4a.port = 

# (list) List of java files to add to the android project
#android.add_java_src = 

# (list) List of jar files to add to the android project
#android.add_jars = 

# (list) List of resources to copy into the android project
#android.add_resources = 

# (list) List of frameworks to add to the android project
#android.add_frameworks = 

# (list) List of native libraries to add to the android project
#android.add_native_libs = 

# (str) python-for-android branch to use, default is master
#p4a.branch = master

# (str) OUYA Console category. Should be one of GAME o APP
#android.ouya.category = APP

# (str) Filename of OUYA Console icon. It must be a 732x412 png image.
#android.ouya.icon.filename = %(source.dir)s/data/ouya_icon.png

# (str) XML file to include as an intent filters in AndroidManifest.xml
#android.manifest.intent_filters = 

# (str) launchMode to set for the main activity
#android.manifest.launch_mode = standard

# (list) Android additional libraries to copy into libs/arch
#android.add_libs_armeabi_v7a = libs/android-v7a/*.so
#android.add_libs_arm64_v8a = libs/android-v8a/*.so
#android.add_libs_x86 = libs/android-x86/*.so
#android.add_libs_mips = libs/android-mips/*.so

# (bool) Indicate whether the screen should stay on
# No-sleep is only for the screen, not the CPU!
#android.meta_data = 

# (str) Android logcat filters to use
#android.logcat_filters = *:S python:D

# (str) Android additional attributes to set in <manifest> tag
#android.manifest.attributes = 

# (str) The Android arch to build for, choices: armeabi-v7a, arm64-v8a, x86, x86_64
# (this is duplicated with the architectures above, keep them synced)

[buildozer]

# (int) log level (0 = error only, 1 = info, 2 = debug (with command output))
log_level = 2

# (int) display warning lines in log
warn_on_root = 1

# (str) Path to build artifacts
#build_dir = ./.buildozer

# (str) Path to build output (APK, AAB, IPA)
#bin_dir = ./bin

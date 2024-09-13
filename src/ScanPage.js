import { createStackNavigator } from '@react-navigation/stack';
import React, { Component } from 'react';
import { AppState, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarcodeTracking,
  BarcodeTrackingBasicOverlay,
  BarcodeTrackingBasicOverlayStyle,
  BarcodeTrackingSettings,
  Symbology,
} from 'scandit-react-native-datacapture-barcode';
import {
  Camera,
  DataCaptureContext,
  DataCaptureView,
  FrameSourceState,
  VideoResolution,
} from 'scandit-react-native-datacapture-core';

import { Button } from './Button';
import { requestCameraPermissionsIfNeeded } from './camera-permission-handler';
import { styles } from './styles';

const Stack = createStackNavigator();

export class ScanPage extends Component {

  constructor() {
    super();

    // Enter your Scandit License key here.
    // Your Scandit License key is available via your Scandit SDK web account.
    this.dataCaptureContext = DataCaptureContext.forLicenseKey('AaUlUxUlMDHlF+VHIwzhnXgTOLvlOWULCwSqDxE3qXf7acTOhmyj10pWhqnyWVrs7kC4760YbAcMUi1NA1/z6hxAoqM0BIqpBS0l5JAuIJioPtrav2rZVe1fUBfucCJJQDrtGIFv3KQ2X08IVRUlKqZHYqB2Sw8cDkioCgtmdueXfkUscXSrwLdnpnqfZiBsYVk95CxTg1mKBgh6cVqIUlVe4ArQbAk8umpCujJJc75VUZTheWhH5u4Qr6yiWwffc3BDDwxnFpO1YKdTo3D2wHBUutfDdCo5FwNSa/pRC3hQddLzj0ll081SLJtyeMEUNWo/TqAkNZ4pY3dydViaJDJaXGaiV24xu1fJXT5bTjyDRvMLUVN8huxOQJFaVMA8/gDPZZV37jhfR+ubPmFlcM5S6CTaZtZJhEOiv+1BtSlJY/dNtiwE3DN4y3YBcrGRKT5hJqRRk2nnWWHE9ENVE65qeLeUeqOQlWkvjAtDZSekRYnlbX75RBB+EDz2OdqlYFyLYUQNHT4SNwpKvC83sPZhaz//QSYFABnrD1wwg9Lu8KIosuUHfMkKXsyAcXCAIVvQwn+QKBViRp9uT8w5KwYDFYvUOBH32aUZYDSytYuw8A66ensEDvK0yEXmFfIjvCMMBsNidFjrPO739mNE/vlM5nuhyZzE0n2pxjmQUug0cIL5HnWROzXl5clMsxQkILgzIILUAlG8ziVx7mF8cLmrBAvteunBs8bdVkWLKORKZ10zqrHPjJKSz6wm+kSTGRn7HKjlZ/cRPjQ3L1fUnzYLwIVwrlGKAeipXgxBkCwmhYDydVT1P+APrq2Xn+HiLPeSZG+5nGs9bzaj5D12gI8cYgwaP6vnucbN9ezAjQP50ok1j40AuB9TsaK3Pjcz6UA85fxlVqaztcxt9juE6R1aG4daACrpYke5Z1nfLlav6LW1HVk4CFDbePCQI2fMN0YkvvG8kzV8hD3+hxfJgqHiom5ipvRYq305lWGusADy76t9J+hI+VG9DS+DNPhe0lqwcnjxaqZV05r5c4AKULxkS2z7Sta0Onsz4KFxLC+GPtoLddl8vhq8vrrIx1XYbkDOOdoueYwoI1Zbx7G4ixeUJ74dqF7z7SG/fItYU4wJqN2OaD5MwK27a2htPVjEAB8VmfjQXCpGP8d/HfIfccYBfPvoFCctAC8dkduYtsIOycjSN9zh9GACjZCV13LJ4h08OV9qvYXeIw==');
    this.viewRef = React.createRef();

    this.results = {};
  }

  componentDidMount() {
    this.handleAppStateChangeSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    this.setupScanning();
    this.startCamera();

    this.unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.results = {};
    });
  }

  componentWillUnmount() {
    this.handleAppStateChangeSubscription.remove();
    this.dataCaptureContext.dispose();
    this.unsubscribeFocus();
  }

  handleAppStateChange = async (nextAppState) => {
    if (nextAppState.match(/inactive|background/)) {
      this.stopCapture();
    } else {
      this.startCapture();
    }
  }

  startCapture() {
    this.startCamera();
    this.barcodeTracking.isEnabled = true;
  }

  stopCapture() {
    this.barcodeTracking.isEnabled = false;
    this.stopCamera();
  }

  goToResults() {
    this.props?.navigation?.navigate('results', { results: this.results });
  }

  stopCamera() {
    if (this.camera) {
      this.camera.switchToDesiredState(FrameSourceState.Off);
    }
  }

  startCamera() {
    if (!this.camera) {
      // Use the world-facing (back) camera and set it as the frame source of the context. The camera is off by
      // default and must be turned on to start streaming frames to the data capture context for recognition.
      const cameraSettings = BarcodeTracking.recommendedCameraSettings;
      cameraSettings.preferredResolution = VideoResolution.FullHD;

      this.camera = Camera.withSettings(cameraSettings);
      this.dataCaptureContext.setFrameSource(this.camera);
    }

    // Switch camera on to start streaming frames and enable the barcode tracking mode.
    // The camera is started asynchronously and will take some time to completely turn on.
    requestCameraPermissionsIfNeeded()
      .then(() => this.camera.switchToDesiredState(FrameSourceState.On))
      .catch(() => BackHandler.exitApp());
  }

  setupScanning() {
    // The barcode tracking process is configured through barcode tracking settings
    // which are then applied to the barcode tracking instance that manages barcode tracking.
    const settings = new BarcodeTrackingSettings();

    // The settings instance initially has all types of barcodes (symbologies) disabled. For the purpose of this
    // sample we enable a very generous set of symbologies. In your own app ensure that you only enable the
    // symbologies that your app requires as every additional enabled symbology has an impact on processing times.
    settings.enableSymbologies([
      Symbology.EAN13UPCA,
      Symbology.EAN8,
      Symbology.UPCE,
      Symbology.Code39,
      Symbology.Code128,
    ]);

    // Create new barcode tracking mode with the settings from above.
    this.barcodeTracking = BarcodeTracking.forContext(this.dataCaptureContext, settings);

    // Register a listener to get informed whenever a new barcode is tracked.
    this.barcodeTrackingListener = {
      didUpdateSession: (_, session) => {
        Object.values(session.trackedBarcodes).forEach(trackedBarcode => {
          const { data, symbology } = trackedBarcode.barcode;
          this.results[data] = { data, symbology };
        });
      }
    };

    this.barcodeTracking.addListener(this.barcodeTrackingListener);

    // Add a barcode tracking overlay to the data capture view to render the location of captured barcodes on top of
    // the video preview. This is optional, but recommended for better visual feedback.
    BarcodeTrackingBasicOverlay.withBarcodeTrackingForViewWithStyle(
        this.barcodeTracking,
        this.viewRef.current,
        BarcodeTrackingBasicOverlayStyle.Frame
    );
  }

  render() {
    return (
      <>
        <DataCaptureView style={{ flex: 1 }} context={this.dataCaptureContext} ref={this.viewRef} />
        <SafeAreaView style={styles.buttonContainer}>
          <Button styles={styles.button} textStyles={styles.buttonText} title='Done' onPress={() => this.goToResults()} />
        </SafeAreaView>
      </>
    );
  };
}
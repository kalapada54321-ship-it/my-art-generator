import { ParticleGenerationResult, StudioConfig } from '../types/studio';

/**
 * Generates an Adobe Illustrator ExtendScript (.jsx) script that imports the
 * accompanying ParticleForge SVG/EPS vector file, promotes its logical vector groups
 * to native top-level Illustrator Layers, and saves the document as a native .ai file.
 */
export function generateIllustratorJSXScript(
  result: ParticleGenerationResult,
  config: StudioConfig,
  companionVectorFilename: string
): string {
  const w = Math.round(result.artboardWidthPx);
  const h = Math.round(result.artboardHeightPx);
  const baseName = (config.export.filename || 'particleforge-artwork').replace(
    /\.(svg|eps|ai|jsx)$/i,
    ''
  );

  return `/**
 * ParticleForge Studio — Adobe Illustrator Native (.AI) Layer & Save Automation Script
 * ------------------------------------------------------------------------------------
 * Artwork: ${baseName}
 * Dimensions: ${w} x ${h} pt/px
 * Total Editable Vector Particles: ${result.stats.totalCount}
 *
 * HOW TO USE IN ADOBE ILLUSTRATOR:
 * 1. Keep "${companionVectorFilename}" in the same folder as this .jsx script (or select it when prompted).
 * 2. In Adobe Illustrator, choose File > Scripts > Other Script... and select this .jsx file.
 * 3. The script will open the vector artwork, organize logical groups into native Illustrator Layers
 *    (Background, Glow Effects, Scattered Particles, Main Particles, Edge Particles, Highlight Particles),
 *    and save a native Adobe Illustrator (.ai) document.
 */

#target illustrator

(function () {
  try {
    var scriptFile = new File($.fileName);
    var folder = scriptFile.parent;
    var vectorFile = new File(folder.fsName + "/" + "${companionVectorFilename}");

    if (!vectorFile.exists) {
      vectorFile = File.openDialog(
        "Select the exported ParticleForge vector file (${companionVectorFilename})",
        "*.svg;*.eps"
      );
    }

    if (!vectorFile || !vectorFile.exists) {
      alert("ParticleForge Studio: Vector source file was not selected. Aborting script.");
      return;
    }

    var doc = app.open(vectorFile);
    app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

    // Promote logical top-level groups into distinct native Illustrator Layers
    var groupLayerNames = [
      "Highlight_Particles",
      "Edge_Particles",
      "Main_Particles",
      "Scattered_Particles",
      "Glow_Effects",
      "Background"
    ];

    for (var i = 0; i < groupLayerNames.length; i++) {
      var gName = groupLayerNames[i];
      try {
        var grp = doc.groupItems.getByName(gName);
        if (grp) {
          var newLayer = doc.layers.add();
          newLayer.name = gName.replace(/_/g, " ");
          grp.move(newLayer, ElementPlacement.PLACEATBEGINNING);
        }
      } catch (innerErr) {
        // Group not present in current export settings; skip safely
      }
    }

    // Prompt where to save the native .ai file
    var defaultAiFile = new File(folder.fsName + "/${baseName}.ai");
    var saveTarget = defaultAiFile.saveDlg(
      "Save Native Adobe Illustrator (.ai) Artwork",
      "Adobe Illustrator (*.ai):*.ai"
    );

    if (saveTarget) {
      var aiOptions = new IllustratorSaveOptions();
      aiOptions.pdfCompatible = true;
      aiOptions.embedICCProfile = true;
      aiOptions.compressed = true;
      doc.saveAs(saveTarget, aiOptions);
      alert(
        "ParticleForge Studio:\\nSuccessfully saved native Adobe Illustrator document with editable vector particle layers:\\n" +
        saveTarget.fsName
      );
    }
  } catch (err) {
    alert("ParticleForge Illustrator Bridge Error: " + err.message);
  }
})();
`;
}

def mergeFiles(fileNames, outputFileName):
    with open(outputFileName, 'wb') as outputFile:
        for fileName in fileNames:
            with open(fileName, 'rb') as inputFile:
                outputFile.write(inputFile.read())

mergeFiles(['js/1_utils.js', 'js/2_denim.js'], 'artblocks files/1.js')
mergeFiles(['js/3_pattern.js', 'js/4_colorFuncs.js', 'js/5_thread.js'], 'artblocks files/2.js')
mergeFiles(['js/6_patches.js', 'js/7_compositions.js', 'js/8_sketch.js'], 'artblocks files/3.js')
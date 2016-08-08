describe "when we open a file and set it to the index file", ->
  it "should set the index file in the config", ->
    waitsForPromise ->
      atom.workspace.open('test.mc.php').then (editor) ->
        expect(editor.getPath()).toContain 'test.mc.php'

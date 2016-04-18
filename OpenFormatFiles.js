/**
 * Created by jgn on 29/03/16.
 */
var openformatFiles = {

    /**
     * Main function to save configuration.
     */
    save: function (saveFilename, jsonData) {
      if (saveFilename == undefined) {
        var errorText = "Filename is not set.";
        alert(errorText);
        throw new Error(errorText);
      }
      if (openformatFiles == undefined) {
        var errorText = "Text is empty.";
        alert(errorText);
        throw new Error(errorText);
      }
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          var response = JSON.parse(xhttp.responseText);
          if (response.status == 'error') {
            alert(response.msg);
            throw new Error(response.msg);
          } else {
            document.filename = saveFilename;
            alert(response.msg);
          }
        }
      };
      xhttp.open("POST", "../OpenFormatFiles.php", true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send("action=save&jsonFile=" + encodeURIComponent(saveFilename) + "&jsonData=" + encodeURIComponent(jsonData));
    },

    /**
     * Main function to load configuration.
     */
    load: function (loadFilename) {
      if (loadFilename == undefined) {
        var errorText = "Filename is not set.";
        alert(errorText);
        throw new Error(errorText);
      }
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          var response = JSON.parse(xhttp.responseText);
          if (response.status == 'error') {
            alert(response.msg);
            throw new Error(response.msg);
          } else {
            editor.setText(response.data);
            alert(loadFilename);
            document.filename = loadFilename;
            document.getElementById("overlay").style.display = "none";
          }
        }
      };
      xhttp.open("POST", "../OpenFormatFiles.php", true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send("action=load&jsonFile=" + loadFilename);
    },

    /**
     * Main function to list configuration files.
     */
    list: function () {
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          var response = JSON.parse(xhttp.responseText);
          if (response.status == 'error') {
            alert(response.msg);
            throw new Error(response.msg);
          } else {
            document.getElementById("modal-filelist-content").innerHTML = response.data;
          }
        }
      };
      xhttp.open("POST", "../OpenFormatFiles.php", true);
      xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhttp.send("action=list");
    }

};
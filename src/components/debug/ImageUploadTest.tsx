import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type {
  GetWorkspacesQuery,
  GetImagesQuery,
  UploadImageMutation,
  DeleteImageMutation,
  GetWorkspacesQueryVariables,
  GetImagesQueryVariables,
  UploadImageMutationVariables,
  DeleteImageMutationVariables,
  ImageUploadInput,
} from '../../generated/graphql';
import { graphql } from '../../generated';
import { getQueryString } from '../../utils/graphql';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export function ImageUploadTest() {
  const [workspaces, setWorkspaces] = useState<
    GetWorkspacesQuery['workspaces']
  >([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [altText, setAltText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<
    GetImagesQuery['images']
  >([]);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Load images when workspace is selected
  useEffect(() => {
    if (selectedWorkspaceId) {
      loadImages(selectedWorkspaceId);
    } else {
      setUploadedImages([]);
    }
  }, [selectedWorkspaceId]);

  // Preview selected file
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl('');
    }
  }, [selectedFile]);

  const loadWorkspaces = async () => {
    try {
      const query = graphql(`
        query GetWorkspaces {
          workspaces {
            id
            name
            description
            createdAt
            updatedAt
          }
        }
      `);

      const result = await invoke<string>('graphql_query', {
        query: getQueryString(query),
        variables: null,
      });

      const response: GraphQLResponse<GetWorkspacesQuery> = JSON.parse(result);

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      setWorkspaces(response.data?.workspaces || []);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setUploadError(`Failed to load workspaces: ${error}`);
    }
  };

  const loadImages = async (workspaceId: string) => {
    setIsLoadingImages(true);
    try {
      const query = graphql(`
        query GetImages($workspaceId: UUID!) {
          images(workspaceId: $workspaceId) {
            id
            originalFilename
            filePath
            mimeType
            fileSize
            width
            height
            altText
            createdAt
            updatedAt
            dataUrl
          }
        }
      `);

      const variables: GetImagesQueryVariables = { workspaceId };

      const result = await invoke<string>('graphql_query', {
        query: getQueryString(query),
        variables,
      });

      const response: GraphQLResponse<GetImagesQuery> = JSON.parse(result);

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      setUploadedImages(response.data?.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
      setUploadError(`Failed to load images: ${error}`);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only JPEG, PNG, and WebP images are supported');
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setUploadError('');
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedWorkspaceId) {
      setUploadError('Please select both a file and workspace');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Convert file to base64
      const base64Data = await convertFileToBase64(selectedFile);

      const mutation = graphql(`
        mutation UploadImage($input: ImageUploadInput!) {
          uploadImage(input: $input) {
            id
            workspaceId
            originalFilename
            filePath
            mimeType
            fileSize
            width
            height
            altText
            createdAt
            updatedAt
            dataUrl
          }
        }
      `);

      const input: ImageUploadInput = {
        workspaceId: selectedWorkspaceId,
        filename: selectedFile.name,
        data: base64Data,
        altText: altText.trim() || undefined,
      };

      const variables: UploadImageMutationVariables = { input };

      const result = await invoke<string>('graphql_query', {
        query: getQueryString(mutation),
        variables,
      });

      const response: GraphQLResponse<UploadImageMutation> = JSON.parse(result);

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      // Clear form
      setSelectedFile(null);
      setAltText('');
      setPreviewUrl('');

      // Reset file input
      const fileInput = document.getElementById(
        'fileInput'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Reload images
      await loadImages(selectedWorkspaceId);

      console.log('Image uploaded successfully:', response.data?.uploadImage);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const mutation = graphql(`
        mutation DeleteImage($id: UUID!) {
          deleteImage(id: $id)
        }
      `);

      const variables: DeleteImageMutationVariables = { id: imageId };

      const result = await invoke<string>('graphql_query', {
        query: getQueryString(mutation),
        variables,
      });

      const response: GraphQLResponse<DeleteImageMutation> = JSON.parse(result);

      if (response.errors) {
        throw new Error(response.errors[0]?.message);
      }

      // Reload images
      if (selectedWorkspaceId) {
        await loadImages(selectedWorkspaceId);
      }

      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      setUploadError(`Delete failed: ${error}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        🖼️ Image Upload Test
      </h1>
      <p className="text-gray-600 mb-8">
        Test GraphQL image upload functionality with Base64 encoding and file
        system storage.
      </p>

      {/* Workspace Selection */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          📁 Select Workspace
        </h3>
        <select
          value={selectedWorkspaceId}
          onChange={e => setSelectedWorkspaceId(e.target.value)}
          className="w-full p-3 border-2 border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a workspace...</option>
          {workspaces.map(workspace => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        {workspaces.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            ⚠️ No workspaces found. Create a workspace first in the GraphQL Test
            tab.
          </p>
        )}
      </div>

      {/* Upload Section */}
      {selectedWorkspaceId && (
        <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            📤 Upload Image
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image File:
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="w-full p-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPEG, PNG, WebP. Max size: 10MB
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Text (Optional):
            </label>
            <input
              type="text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility..."
              className="w-full p-2 border-2 border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview:
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {selectedFile?.name} -{' '}
                  {selectedFile && formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              ❌ {uploadError}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedWorkspaceId || isUploading}
            className={`w-full p-3 rounded-md text-white font-semibold transition-all ${
              isUploading || !selectedFile || !selectedWorkspaceId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 cursor-pointer'
            }`}
          >
            {isUploading ? '⏳ Uploading...' : '🚀 Upload Image'}
          </button>
        </div>
      )}

      {/* Images Gallery */}
      {selectedWorkspaceId && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🖼️ Uploaded Images ({uploadedImages.length})
            </h3>
            <button
              onClick={() => loadImages(selectedWorkspaceId)}
              disabled={isLoadingImages}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-60"
            >
              {isLoadingImages ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          {isLoadingImages && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading images...</p>
            </div>
          )}

          {uploadedImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedImages.map(image => (
                <div
                  key={image.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <img
                      src={image.dataUrl}
                      alt={image.altText || image.originalFilename}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h4
                      className="font-medium text-sm text-gray-800 truncate mb-1"
                      title={image.originalFilename}
                    >
                      {image.originalFilename}
                    </h4>
                    <p className="text-xs text-gray-500 mb-1">
                      {formatFileSize(image.fileSize)} • {image.mimeType}
                    </p>
                    {image.width && image.height && (
                      <p className="text-xs text-gray-500 mb-1">
                        {image.width} × {image.height} px
                      </p>
                    )}
                    {image.altText && (
                      <p className="text-xs text-gray-600 mb-2 italic">
                        "{image.altText}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mb-2">
                      📅 {formatDate(image.createdAt)}
                    </p>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-xs text-gray-400 font-mono"
                        title={image.id}
                      >
                        ID: {image.id.substring(0, 8)}...
                      </span>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                        title="Delete image"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoadingImages &&
            selectedWorkspaceId && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">📭 No images uploaded yet</p>
                <p className="text-sm">
                  Upload your first image to get started!
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

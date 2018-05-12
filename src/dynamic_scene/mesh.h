#ifndef CS248_DYNAMICSCENE_MESH_H
#define CS248_DYNAMICSCENE_MESH_H

#include "scene.h"

#include "../collada/polymesh_info.h"
#include "../halfEdgeMesh.h"
#include "../meshEdit.h"
#include "../shader.h"

#include "skeleton.h"

#include <map>

namespace CS248 {
namespace DynamicScene {

// A structure for holding linear blend skinning information
class LBSInfo {
 public:
  Vector3D blendPos;
  double distance;
};

struct Vector2Df {
public:
  float x, y;
};

struct Vector3Df {
public:
	float x, y, z;
};

class Mesh : public SceneObject {
 public:
  Mesh(Collada::PolymeshInfo &polyMesh, const Matrix4x4 &transform, const std::string shader_prefix = "");

  ~Mesh();

  void set_draw_styles(DrawStyle *defaultStyle, DrawStyle *hoveredStyle,
                       DrawStyle *selectedStyle) override;
  virtual void draw() override;
  virtual void drawGhost() override;

  void draw_pretty() override;

  StaticScene::SceneObject *get_transformed_static_object(double t) override;

  BBox get_bbox() override;

  virtual Info getInfo() override;

  void bevelComputeNewPositions(double inset, double shift);

  virtual void drag(double x, double y, double dx, double dy,
                    const Matrix4x4 &modelViewProj) override;

  BSDF *get_bsdf();
  StaticScene::SceneObject *get_static_object() override;

  void collapse_selected_element();
  void flip_selected_edge();
  void split_selected_edge();
  void erase_selected_element();
  void bevel_selected_element();
  void upsample();
  void downsample();
  void resample();
  void triangulate();

  HalfedgeMesh mesh;

  Skeleton *skeleton;  // skeleton for mesh

  void keyframe(double t);
  void unkeyframe(double t);

  /**
   * Rather than drawing the object geometry for display, this method draws the
   * object with unique colors that can be used to determine which object was
   * selected or "picked" by the cursor.  The parameter pickID is the lowest
   * consecutive integer that has so far not been used by any other object as
   * a picking ID.  (Draw colors are then derived from these IDs.)  This data
   * will be used by Scene::update_selection to make the final determination
   * of which object (and possibly element within that object) was picked.
   */
  virtual void draw_pick(int &pickID, bool transformed = false) override;

  /** Assigns attributes of the selection based on the ID of the
   * object that was picked.  Can assume that pickID was one of
   * the IDs generated during this object's call to draw_pick().
   */
  virtual void setSelection(int pickID, Selection &selection) override;

 private:
  // Helpers for draw().
  void draw_faces(bool smooth = false) const;
  void draw_edges() const;
  void draw_feature_if_needed(Selection *s) const;
  void draw_vertex(const Vertex *v) const;
  void draw_halfedge_arrow(const Halfedge *h) const;
  DrawStyle *get_draw_style(const HalfedgeElement *element) const;

  void check_finite_positions();
  bool alreadyCheckingPositions;

  // a vector of halfedges whose vertices are newly created with bevel
  // on scroll, reposition vertices referenced from these halfedges
  vector<HalfedgeIter> bevelVertices;
  // original position of beveled vertex
  Vector3D beveledVertexPos;
  // original positions of beveled edge, corresponding to bevelVertices
  vector<Vector3D> beveledEdgePos;
  // original vertex positions for face currently being beveled
  vector<Vector3D> beveledFacePos;

  DrawStyle *defaultStyle, *hoveredStyle, *selectedStyle;

  MeshResampler resampler;

  // map from picking IDs to mesh elements, generated during draw_pick
  // and used by setSelection
  std::map<int, HalfedgeElement *> idToElement;

  // Assigns the next consecutive pickID to the given element, and
  // sets the GL color accordingly.  Also increments pickID.
  void newPickElement(int &pickID, HalfedgeElement *e);

  // material
  BSDF *bsdf;

  // Texture map
  vector<unsigned char> diffuse_texture;
  vector<unsigned char> normal_texture;
  vector<unsigned char> environment_texture;
  vector<unsigned char> alpha_texture;
  vector<unsigned char> stub1_texture;
  vector<unsigned char> stub2_texture;
  vector<unsigned char> stub3_texture;
  unsigned int diffuse_texture_width, diffuse_texture_height;
  unsigned int normal_texture_width, normal_texture_height;
  unsigned int environment_texture_width, environment_texture_height;
  unsigned int alpha_texture_width, alpha_texture_height;
  unsigned int stub1_texture_width, stub1_texture_height;
  unsigned int stub2_texture_width, stub2_texture_height;
  unsigned int stub3_texture_width, stub3_texture_height;
  
  string vertex_shader_program;
  string fragment_shader_program;

  vector<vector<size_t>> polygons;
  vector<Collada::Polygon> polygons_carbon_copy;
  
  // Per v
  vector<Vector3Df> vertices;
  vector<Vector3Df> normals;
  vector<Vector2Df> texture_coordinates;
  vector<Vector3Df> tangentData;
  vector<Vector3Df> bitangents;
  
  // Per f
  vector<Vector3Df> diffuse_colors;
  
  // Packed
  vector<Vector3Df> vertexData;
  vector<Vector3Df> diffuse_colorData;
  vector<Vector3Df> normalData;
  vector<Vector2Df> texcoordData;

  vector<Shader> shaders;

  std::vector<std::string> uniform_strings;
  std::vector<float> uniform_values;

  float glObj2World[16];
  float glObj2WorldNorm[9];
    
  GLuint vao;
  
  GLuint vertexBuffer;
  GLuint diffuse_colorBuffer;
  GLuint normalBuffer;
  GLuint texcoordBuffer;
  GLuint tangentBuffer;
  
  GLuint diffuseId;
  GLuint diffuse_colorId;
  GLuint normalId;
  GLuint environmentId;
  GLuint alphaId;
  GLuint stub1Id;
  GLuint stub2Id;
  GLuint stub3Id;

  bool simple_renderable;
  bool simple_colors;
  bool do_texture_mapping;
  bool do_normal_mapping;
  bool do_environment_mapping;
  bool do_blending;
  bool do_disney_brdf;
};

}  // namespace DynamicScene
}  // namespace CS248

#endif  // CS248_DYNAMICSCENE_MESH_H
